import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { toCents, fromCents } from '../api/payments/money.mjs';
import { validateItems } from '../api/orders-service.mjs';
import { createStripeCheckout, createMercadoPagoCheckout, verifyStripeSignature, verifyMercadoPagoSignature, isSettledPayment, fetchMercadoPagoPayment } from '../api/payments/providers.mjs';

const snapshot = { reference: 'order-test-1', total: '0.30', items: [{ productId: 1, name: 'TV', price: '0.10', quantity: 3 }] };
const config = { siteOrigin: 'https://samsungstore.com.mx', secretKey: 'test-key', webhookSecret: 'test-signing-secret', accessToken: 'test-token', sandbox: true };
const now = 1800000000000;

test('money uses integer centavos and rejects negative, imprecise and oversized amounts', () => {
  assert.equal(toCents('0.10') * 3, 30); assert.equal(fromCents(30), '0.30');
  for (const value of ['-1', '1.001', '1e3', '100000000.00', 'NaN']) assert.throws(() => toCents(value));
});

test('duplicate product lines and invalid quantities cannot bypass stock checks', () => {
  assert.throws(() => validateItems([{ productId: 1, quantity: 1 }, { productId: 1, quantity: 1 }]));
  for (const quantity of [0, -1, 0.5, 1000]) assert.throws(() => validateItems([{ productId: 1, quantity }]));
  assert.throws(() => validateItems([]));
});

test('Stripe sends MXN centavos, stable idempotency and server reference', async () => {
  const result = await createStripeCheckout(snapshot, config, async (url, options) => {
    assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions');
    assert.equal(options.headers['Idempotency-Key'], 'checkout-order-test-1');
    assert.equal(options.body.get('line_items[0][price_data][unit_amount]'), '10');
    assert.equal(options.body.get('line_items[0][quantity]'), '3');
    assert.equal(options.body.get('line_items[0][price_data][currency]'), 'mxn');
    return Response.json({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/test' });
  });
  assert.equal(result.sessionId, 'cs_test_1');
});

test('Mercado Pago preference uses pesos, reference and HTTPS notifications', async () => {
  const result = await createMercadoPagoCheckout(snapshot, config, async (url, options) => {
    assert.equal(url, 'https://api.mercadopago.com/checkout/preferences');
    const body = JSON.parse(options.body);
    assert.equal(body.items[0].unit_price, 0.1); assert.equal(body.items[0].currency_id, 'MXN');
    assert.equal(body.external_reference, snapshot.reference);
    assert.equal(body.notification_url, 'https://samsungstore.com.mx/api/payments/mercadopago/webhook');
    return Response.json({ id: 'pref_1', sandbox_init_point: 'https://sandbox.mercadopago.com.mx/checkout/test' });
  });
  assert.equal(result.sessionId, 'pref_1');
});

test('inconsistent totals and absent credentials never initiate provider requests', async () => {
  const fetcher = () => { throw new Error('must not call'); };
  await assert.rejects(createStripeCheckout({ ...snapshot, total: '0.01' }, config, fetcher), /mismatch/);
  await assert.rejects(createStripeCheckout(snapshot, { ...config, webhookSecret: '' }, fetcher), /not configured/);
  await assert.rejects(createMercadoPagoCheckout(snapshot, { ...config, accessToken: '' }, fetcher), /not configured/);
});

test('provider URLs cannot redirect the customer to an unrelated or credentialed host', async () => {
  await assert.rejects(createStripeCheckout(snapshot, config, async () => Response.json({ id: 'x', url: 'https://checkout.stripe.com.evil.test/pay' })), /Unexpected/);
  await assert.rejects(createMercadoPagoCheckout(snapshot, config, async () => Response.json({ id: 'x', sandbox_init_point: 'https://user:pass@mercadopago.com.mx/pay' })), /Unexpected/);
});

test('ambiguous remote failure is surfaced for reconciliation without automatic retry', async () => {
  let calls = 0;
  await assert.rejects(createMercadoPagoCheckout(snapshot, config, async () => { calls++; throw new Error('timeout'); }), /outcome unknown/);
  assert.equal(calls, 1);
});

test('Stripe authenticates the raw body, accepts rotated signatures and rejects tampering/replays', () => {
  const raw = '{"type":"checkout.session.completed"}'; const ts = String(now / 1000);
  const digest = createHmac('sha256', config.webhookSecret).update(`${ts}.${raw}`).digest('hex');
  const header = `t=${ts},v1=${'0'.repeat(64)},v1=${digest}`;
  assert.equal(verifyStripeSignature(raw, header, config.webhookSecret, now), true);
  assert.equal(verifyStripeSignature(raw + ' ', header, config.webhookSecret, now), false);
  assert.equal(verifyStripeSignature(raw, header, config.webhookSecret, now + 301000), false);
  assert.equal(verifyStripeSignature(raw, header, '', now), false);
});

test('Mercado Pago authenticates URL payment id, request id and timestamp', () => {
  const ts = String(now); const id = '12345'; const request = 'request-test';
  const digest = createHmac('sha256', config.webhookSecret).update(`id:${id};request-id:${request};ts:${ts};`).digest('hex');
  const header = `ts=${ts},v1=${digest}`;
  assert.equal(verifyMercadoPagoSignature(id, request, header, config.webhookSecret, now), true);
  assert.equal(verifyMercadoPagoSignature('12346', request, header, config.webhookSecret, now), false);
  assert.equal(verifyMercadoPagoSignature(id, 'other', header, config.webhookSecret, now), false);
  assert.equal(verifyMercadoPagoSignature(id, request, header, config.webhookSecret, now + 301000), false);
});

test('an approved notification requires authoritative amount, currency, reference and session', () => {
  const expected = { ...snapshot, sessionId: 'cs_1' };
  const stripe = { id: 'cs_1', client_reference_id: snapshot.reference, payment_status: 'paid', currency: 'mxn', amount_total: 30 };
  const mp = { external_reference: snapshot.reference, status: 'approved', currency_id: 'MXN', transaction_amount: 0.3 };
  assert.equal(isSettledPayment('stripe', stripe, expected), true);
  assert.equal(isSettledPayment('stripe', { ...stripe, amount_total: 1 }, expected), false);
  assert.equal(isSettledPayment('stripe', { ...stripe, id: 'other' }, expected), false);
  assert.equal(isSettledPayment('mercadopago', mp, expected), true);
  assert.equal(isSettledPayment('mercadopago', { ...mp, currency_id: 'USD' }, expected), false);
  assert.equal(isSettledPayment('mercadopago', { ...mp, transaction_amount_refunded: 0.1 }, expected), false);
  assert.equal(isSettledPayment('mercadopago', { ...mp, status: 'pending' }, expected), false);
});

test('Mercado Pago lookup uses the fixed provider endpoint and rejects path injection', async () => {
  await assert.rejects(fetchMercadoPagoPayment('../1', 'test-token'), /Invalid/);
  const result = await fetchMercadoPagoPayment('12345', 'test-token', async url => {
    assert.equal(url, 'https://api.mercadopago.com/v1/payments/12345');
    return Response.json({ status: 'approved' });
  });
  assert.equal(result.status, 'approved');
});
