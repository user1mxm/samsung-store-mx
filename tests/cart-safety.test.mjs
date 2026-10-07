import test from 'node:test';
import assert from 'node:assert/strict';
import { clampQuantity, restoreCart, reconcileCart, catalogPriceCeiling } from '../src/lib/cart-safety.mjs';

const product = { id: 1, name: 'TV', stock: 1, price: '13400.00' };

test('a single exhibition item cannot be added twice', () => {
  assert.equal(clampQuantity(product, 2), 1);
  assert.equal(clampQuantity({ ...product, stock: 0 }, 1), 0);
});

test('invalid quantities and stock fail closed', () => {
  for (const qty of [-1, 1.5, NaN, Infinity, '2']) assert.equal(clampQuantity(product, qty), 0);
  for (const stock of [-1, 0.5, NaN, Infinity, undefined]) assert.equal(clampQuantity({ ...product, stock }, 1), 0);
});

test('corrupt persisted carts do not crash or create duplicate rows', () => {
  for (const raw of ['null', '{}', 'broken', '[null]']) assert.deepEqual(restoreCart(raw), []);
  const restored = restoreCart(JSON.stringify([
    { product, quantity: 50 }, { product, quantity: 1 },
    { product: { ...product, id: 2, price: 'invalid' }, quantity: 1 },
  ]));
  assert.deepEqual(restored, [{ product, quantity: 1 }]);
});

test('refresh replaces stale prices, clamps reduced stock and drops removed products', () => {
  const updated = { ...product, stock: 2, price: '12500.00' };
  assert.deepEqual(reconcileCart([
    { product: { ...product, stock: 10 }, quantity: 5 },
    { product: { ...product, id: 2 }, quantity: 1 },
  ], [updated]), [{ product: updated, quantity: 2 }]);
  assert.deepEqual(reconcileCart([{ product, quantity: 1 }], [{ ...product, stock: 0 }]), []);
});

test('expensive products remain within the default catalog slider', () => {
  assert.equal(catalogPriceCeiling([{ price: '270000.00' }, product]), 270000);
  assert.equal(catalogPriceCeiling([{ price: '270001.00' }]), 271000);
  assert.equal(catalogPriceCeiling([]), 1000);
});
