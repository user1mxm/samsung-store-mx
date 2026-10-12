import test from 'node:test';
import assert from 'node:assert/strict';
import { demoPaymentResult, demoAmountCents, DEMO_PROVIDERS, DEMO_OUTCOMES } from '../src/lib/payment-simulator.mjs';

test('Stripe and Mercado Pago demo outcomes never report real payment or order', () => {
  for (const provider of DEMO_PROVIDERS) for (const outcome of DEMO_OUTCOMES) {
    const r = demoPaymentResult({ provider, outcome, amountCents: 1299900, reference: 'aacc0011-22bb-44cc-88dd-112233445566' });
    assert.equal(r.kind, 'simulation_only');
    assert.equal(r.outcome, outcome);
    assert.equal(r.reference.startsWith('DEMO-'), true);
    assert.equal(r.currency, 'MXN');
    assert.equal(r.charged, false);
    assert.equal(r.paid, false);
    assert.equal(r.persisted, false);
    assert.equal(r.orderId, null);
    assert.equal(r.providerSessionId, null);
    assert.equal(r.webhookEventId, null);
    assert.equal(Object.isFrozen(r), true);
  }
});

test('reject unknown providers, invalid outcomes, and invalid demo references', () => {
  const base = { provider: 'stripe', outcome: 'approved', amountCents: 100, reference: 'aacc0011-22bb-44cc-88dd-112233445566' };
  for (const change of [{ provider: 'other' }, { outcome: 'paid' }, { reference: 'real_payment' }, { amountCents: 0 }, { amountCents: 0.1 }, { amountCents: Infinity }]) {
    assert.throws(() => demoPaymentResult({ ...base, ...change }));
  }
});

test('MXN totals use integer centavos and reject imprecise or excessive values', () => {
  assert.equal(demoAmountCents(12999), 1299900);
  assert.equal(demoAmountCents(0.1), 10);
  for (const n of [-1, 0, NaN, Infinity, 0.001, 10000000]) assert.throws(() => demoAmountCents(n));
});

test('simulator does not import gateway, network, payment ledger, or webhook modules', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/lib/payment-simulator.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(fetch|XMLHttpRequest|paymentAttempts|settleCheckout|createStripeCheckout|createMercadoPagoCheckout)\b/);
});
