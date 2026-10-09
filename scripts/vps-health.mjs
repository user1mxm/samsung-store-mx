import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { openSync, closeSync, readFileSync } from 'node:fs';
import { runtimeConfig } from './vps-config.mjs';

async function check(origin,commerce=false) {
  const get = route => fetch(origin + route, { headers: { accept: 'text/html' }, signal: AbortSignal.timeout(10000) });
  const root = await get('/'); const html = await root.text();
  assert.equal(root.status, 200); assert.match(html, /id="root"/);
  for (const route of ['/login','/login/admin','/change-password','/mis-pedidos']) assert.equal((await get(route)).status,200);
  const asset = html.match(/src="(\/assets\/[^\"]+\.js)"/)?.[1];
  assert.ok(asset); assert.equal((await get(asset)).status,200);
  for (const [name, validate] of [['ping', value => value.ok === true], ['product.list', value => Array.isArray(value) && value.length > 0], ['product.categories', value => Array.isArray(value) && value.length > 0], ['order.paymentProviders', value => Array.isArray(value) && value.length === 0]]) {
    const response = await get(`/api/trpc/${name}`); assert.equal(response.status,200);
    assert.ok(validate((await response.json()).result.data.json), `Health check failed: ${name}`);
  }
  if(commerce){
    const response=await get('/api/trpc/commerce.profiles');assert.equal(response.status,200);assert.ok(Array.isArray((await response.json()).result.data.json));
    assert.match(root.headers.get('content-security-policy-report-only')||'',/frame-ancestors 'none'/);
    assert.equal((await fetch(origin+'/api/support/file',{method:'POST',signal:AbortSignal.timeout(10000)})).status,401);
    assert.notEqual((await get('/api/trpc/commerce.operations')).status,200);
  }
  assert.equal((await fetch(origin + '/api/upload', { method:'POST', signal:AbortSignal.timeout(10000) })).status,401);
}

const [mode, live, runtimeFile, backupDir] = process.argv.slice(2);
let child, fd;
try {
  if (mode === 'domain') {
    await check('https://samsungstore.com.mx',true);
    const html = await (await fetch('https://samsungstore.com.mx/', { headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(10000) })).text();
    const built = readFileSync(new URL('../dist/public/index.html', import.meta.url), 'utf8');
    const asset = built.match(/src="(\/assets\/[^\"]+\.js)"/)?.[1];
    assert.ok(asset); assert.ok(html.includes(asset), 'Domain serves a different frontend build');
  }
  else if (mode === 'live') await check('http://127.0.0.1:3001',true);
  else if (mode === 'shadow') {
    const config = runtimeConfig(live, runtimeFile);
    const listener = createServer(); listener.listen(0,'127.0.0.1'); await once(listener,'listening');
    const port = listener.address().port; await new Promise(resolve => listener.close(resolve));
    fd = openSync(`${backupDir}/shadow.log`, 'wx',0o600);
    child = spawn(process.execPath, [new URL('../dist/boot.js',import.meta.url).pathname], { cwd:new URL('..',import.meta.url).pathname, env:{...process.env,...config,NODE_ENV:'production',PORT:String(port),PAYMENTS_ENABLED:'0',BIND_HOST:'127.0.0.1'},stdio:['ignore',fd,fd] });
    let ready = false;
    for (let count=0;count<100;count++) {
      if (child.exitCode !== null) throw new Error('Shadow server exited');
      try { const r=await fetch(`http://127.0.0.1:${port}`,{signal:AbortSignal.timeout(500)}); if(r.ok){ready=true;break;} } catch {}
      await delay(100);
    }
    assert.ok(ready); await check(`http://127.0.0.1:${port}`);
  } else throw new Error('Invalid health command');
  console.log(`VPS ${mode} health passed: catalogue, categories, account routes, upload authentication, payments disabled`);
} catch {
  console.error('VPS health failed; inspect private logs and configuration.'); process.exitCode=1;
} finally {
  if(child && child.exitCode === null){ const exited=once(child,'exit');child.kill('SIGTERM');await exited; }
  if(fd !== undefined) closeSync(fd);
}
