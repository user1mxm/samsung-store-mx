import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

process.env.PAYMENTS_ENABLED = '0';
const root = fileURLToPath(new URL('..', import.meta.url));
const dir = await mkdtemp(join(root, '.route-contract-'));
let router;
try {
  const outfile = join(dir, 'router.mjs');
  await build({ stdin: { contents: 'export { appRouter } from "./api/router.ts";', resolveDir: root }, outfile, bundle: true, platform: 'node', format: 'esm', banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" } });
  router = (await import(pathToFileURL(outfile))).appRouter;
} finally { await rm(dir, { recursive: true, force: true }); }
const context = user => ({ req: new Request('https://example.invalid/api/trpc'), resHeaders: new Headers(), user });
const user = { id: 1, name: 'Fixture', role: 'client', password: 'private-hash', passwordResetToken: 'private-token' };
const caller = router.createCaller(context(user));

test('anonymous cart, orders and password changes enforce authentication', async () => {
  const anonymous = router.createCaller(context());
  await assert.rejects(anonymous.cart.list(), error => error.code === 'UNAUTHORIZED');
  await assert.rejects(anonymous.order.list(), error => error.code === 'UNAUTHORIZED');
  await assert.rejects(anonymous.localAuth.changePassword({ currentPassword: 'old', newPassword: 'new-pass' }), error => error.code === 'UNAUTHORIZED');
});

test('disabled checkout cannot reserve stock and legacy creation cannot bypass the guard', async () => {
  assert.deepEqual(await caller.order.paymentProviders(), []);
  await assert.rejects(caller.order.checkout({ provider: 'stripe', requestKey: '8115d41e-bc3d-4cf7-8dca-16c52a310341', items: [{ productId: 1, quantity: 1 }], shippingAddress: { name: 'Fixture', email: 'fixture@example.invalid', phone: '5555555555', address: 'Fixture 123', city: 'CDMX', postalCode: '01000' } }), error => error.code === 'PRECONDITION_FAILED');
  await assert.rejects(caller.order.create({ items: [{ productId: 1, quantity: 1 }] }), error => error.code === 'PRECONDITION_FAILED');
});

test('legacy commission requests cannot fabricate or duplicate earnings', async () => {
  await assert.rejects(caller.referral.generateCommissions({ orderId: 1, buyerId: 2, total: 99999 }), error => error.code === 'PRECONDITION_FAILED');
});

test('authenticated identity responses omit stored password/reset credentials', async () => {
  const identity = await caller.auth.me();
  assert.equal(identity.id, 1); assert.equal(identity.role, 'client');
  assert.equal('password' in identity, false); assert.equal('passwordResetToken' in identity, false);
});
