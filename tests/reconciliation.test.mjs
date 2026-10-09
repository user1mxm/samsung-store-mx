import test from 'node:test';
import assert from 'node:assert/strict';
import { viewerProduct } from '../src/lib/viewer-product.mjs';
import { publicUser } from '../api/lib/public-user.mjs';

test('viewer facts belong to the selected product and never fabricate OLED/144 Hz specs', () => {
  const product = { name: 'Crystal UHD 65"', model: 'UN65DU8000', specs: JSON.stringify({ Panel: 'Crystal UHD', Hz: '60 Hz' }) };
  assert.deepEqual(viewerProduct(product), { name: product.name, model: product.model, specs: [['Panel', 'Crystal UHD'], ['Hz', '60 Hz']] });
  assert.deepEqual(viewerProduct({ ...product, specs: 'broken-json' }).specs, []);
  assert.deepEqual(viewerProduct({ ...product, specs: { Panel: { value: 'OLED' }, Hz: null } }).specs, []);
  assert.equal(viewerProduct().name, 'Vista ilustrativa del televisor');
});

test('public identity omits hashes, reset tokens and all unexpected private columns', () => {
  const user = { id: 1, name: 'Fixture', role: 'client', password: 'hash', passwordResetToken: 'token', passwordResetExpiry: new Date(), internalFlag: 'private' };
  const result = publicUser(user);
  assert.equal(result.id, 1);
  assert.equal(result.role, 'client');
  for (const key of ['password', 'passwordResetToken', 'passwordResetExpiry', 'internalFlag']) assert.equal(key in result, false);
  assert.equal(publicUser(null), null);
});


test('password changes support legacy accounts and use salted scrypt for new hashes', async () => {
  const { hashPassword, verifyPassword } = await import('../api/lib/password-core.mjs');
  const { createHash } = await import('node:crypto');
  const secret = 'test-only-secret';
  const legacy = createHash('sha256').update('correct' + secret).digest('hex');
  assert.equal(await verifyPassword('correct', legacy, secret), true);
  assert.equal(await verifyPassword('wrong', legacy, secret), false);
  const first = await hashPassword('correct'); const second = await hashPassword('correct');
  assert.notEqual(first, second); assert.match(first, /^scrypt\$/);
  assert.equal(await verifyPassword('correct', first, secret), true);
  assert.equal(await verifyPassword('wrong', first, secret), false);
  assert.equal(await verifyPassword('correct', 'scrypt$bad', secret), false);
});


test('admin image upload persists a file and rejects failed or unsafe upload responses', async () => {
  const { uploadProductImage } = await import('../src/lib/upload-image.mjs');
  const file = new File(['fixture'], 'fixture.png', { type: 'image/png' });
  let calls = 0;
  const request = async (url, options) => {
    calls++; assert.equal(url, '/api/upload'); assert.equal(options.method, 'POST'); assert.equal(options.credentials, 'same-origin');
    assert.equal(options.body.get('file').name, 'fixture.png');
    return new Response(JSON.stringify({ success: true, url: '/uploads/fixture.png' }), { status: 200 });
  };
  assert.equal(await uploadProductImage(file, request), '/uploads/fixture.png'); assert.equal(calls, 1);
  await assert.rejects(uploadProductImage(new File(['x'], 'bad.svg', { type: 'image/svg+xml' }), request), /Usa una imagen/); assert.equal(calls, 1);
  await assert.rejects(uploadProductImage(file, async () => new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 })), /Authentication/);
  await assert.rejects(uploadProductImage(file, async () => new Response(JSON.stringify({ success: true, url: 'javascript:alert(1)' }))), /URL de imagen/);
});
