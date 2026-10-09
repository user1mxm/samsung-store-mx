import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

// Run the bundle outside the project directory to exercise absolute static paths.
const cwd = await mkdtemp(join(tmpdir(), 'storefront-smoke-'));
const listener = createServer();
listener.listen(0, '127.0.0.1');
await once(listener, 'listening');
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
await writeFile(join(cwd, 'fixture.png'), 'fixture-image');
const child = spawn(process.execPath, [fileURLToPath(new URL('../dist/boot.js', import.meta.url))], {
  cwd,
  env: {
    ...process.env, NODE_ENV: 'production', PORT: String(port),
    APP_ID: 'smoke-test', APP_SECRET: 'test-only-not-a-real-credential',
    UPLOAD_DIR: cwd,
    DATABASE_URL: 'mysql://test:test@127.0.0.1:1/test',
    KIMI_AUTH_URL: 'https://example.invalid', KIMI_OPEN_URL: 'https://example.invalid',
    PAYMENTS_ENABLED: '1', SITE_ORIGIN: 'https://samsungstore.com.mx',
    STRIPE_SECRET_KEY: 'sk_test_fixture', STRIPE_WEBHOOK_SECRET: 'fixture-signing-secret',
    MERCADOPAGO_ACCESS_TOKEN: 'fixture-token', MERCADOPAGO_WEBHOOK_SECRET: 'fixture-signing-secret', MERCADOPAGO_MODE: 'sandbox',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
child.stdout.on('data', data => { output += data; });
child.stderr.on('data', data => { output += data; });
const origin = `http://127.0.0.1:${port}`;
try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) throw new Error(`Server exited: ${output}`);
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(1000) });
      if (response.ok) { ready = true; break; }
    } catch { /* Startup is asynchronous. */ }
    await delay(100);
  }
  assert.ok(ready, `Server did not become ready: ${output}`);
  const root = await fetch(origin);
  const html = await root.text();
  assert.equal(root.headers.get("cache-control"), "no-cache");
  assert.equal(root.status, 200);
  assert.match(html, /id="root"/);
  const login = await fetch(`${origin}/login`, { headers: { accept: 'text/html' } });
  assert.equal(login.status, 200);
  assert.equal(await login.text(), html);
  for (const route of ['/login/admin', '/change-password', '/mis-pedidos']) {
    assert.equal((await fetch(origin + route, { headers: { accept: 'text/html' } })).status, 200);
  }
  assert.equal((await fetch(origin + '/api/upload', { method: 'POST' })).status, 401);
  const uploaded = await fetch(origin + '/uploads/fixture.png');
  assert.equal(uploaded.status, 200);
  assert.equal(await uploaded.text(), 'fixture-image');
  assert.equal((await fetch(origin + '/uploads/missing.png')).status, 404);
  const asset = html.match(/src="(\/assets\/[^\"]+\.js)"/)?.[1];
  assert.ok(asset, 'Built entry script missing');
  const js = await fetch(origin + asset);
  assert.equal(js.status, 200);
  assert.match(js.headers.get('content-type'), /javascript/);
  assert.match(js.headers.get('cache-control'), /immutable/);
  const brotli = await fetch(origin + asset, { headers: { 'accept-encoding': 'br' } });
  assert.equal(brotli.headers.get('content-encoding'), 'br');
  assert.equal(await brotli.text(), await js.text());
  assert.match(brotli.headers.get('vary'), /Accept-Encoding/);
  const compressedHtml = await fetch(origin, { headers: { 'accept-encoding': 'gzip' } });
  assert.equal(compressedHtml.headers.get('cache-control'), 'no-cache');
  assert.equal(await compressedHtml.text(), html);
  assert.equal((await fetch(`${origin}/api/not-a-route`)).status, 404);
  assert.equal((await fetch(`${origin}/assets/not-a-file.js`)).status, 404);
  const ping = await fetch(`${origin}/api/trpc/ping`);
  assert.equal(ping.status, 200);
  assert.equal(ping.headers.get("cache-control"), "private, no-store");
  assert.equal((await ping.json()).result.data.json.ok, true);
  for (const provider of ['stripe', 'mercadopago']) {
    const response = await fetch(`${origin}/api/payments/${provider}/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(response.status, 401, 'Unsigned webhook must never change payment state');
  }
  console.log('Production smoke passed: root, account SPA routes, JS asset, upload authentication/disk serving, missing routes, unsigned webhooks and API ping.');
} finally {
  if (child.exitCode === null) {
    const exited = once(child, 'exit');
    child.kill('SIGTERM');
    await exited;
  }
  await rm(cwd, { recursive: true, force: true });
}
