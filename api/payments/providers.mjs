import { createHmac, timingSafeEqual } from 'node:crypto';
import { toCents } from './money.mjs';

function matchHex(actual, expected) {
  return /^[a-f0-9]{64}$/i.test(actual ?? '') && timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

function signatureParts(header) {
  const parts = new Map();
  for (const pair of (header ?? '').split(',')) {
    const split = pair.indexOf('=');
    if (split < 1) continue;
    const key = pair.slice(0, split).trim();
    const value = pair.slice(split + 1).trim();
    parts.set(key, [...(parts.get(key) ?? []), value]);
  }
  return parts;
}

export function verifyStripeSignature(rawBody, signature, secret, now = Date.now()) {
  if (!secret) return false;
  const parts = signatureParts(signature);
  const timestamps = parts.get('t') ?? [];
  if (timestamps.length !== 1 || !/^\d+$/.test(timestamps[0])) return false;
  const timestamp = timestamps[0];
  if (Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac('sha256', secret).update(timestamp + '.').update(rawBody).digest('hex');
  return (parts.get('v1') ?? []).some(value => matchHex(value, expected));
}

export function verifyMercadoPagoSignature(dataId, requestId, signature, secret, now = Date.now()) {
  if (!secret || !requestId || !/^[a-z0-9_-]+$/i.test(dataId ?? '')) return false;
  const parts = signatureParts(signature);
  const timestamps = parts.get('ts') ?? [];
  if (timestamps.length !== 1 || !/^\d+$/.test(timestamps[0])) return false;
  const timestamp = timestamps[0];
  // Mercado Pago sends milliseconds; allow second precision from older integrations.
  const timeMs = Number(timestamp) > 1e12 ? Number(timestamp) : Number(timestamp) * 1000;
  if (Math.abs(now - timeMs) > 300000) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');
  return (parts.get('v1') ?? []).some(value => matchHex(value, expected));
}

function originUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('A public HTTPS origin is required');
  return url.origin;
}

function validateSnapshot(snapshot) {
  if (!/^[a-z0-9_-]{1,64}$/i.test(snapshot.reference ?? '') || !Array.isArray(snapshot.items) || !snapshot.items.length || snapshot.items.length > 50) throw new Error('Invalid server order snapshot');
  let total = 0;
  for (const line of snapshot.items) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 999 || !line.name) throw new Error('Invalid order line');
    total += toCents(line.price) * line.quantity;
  }
  if (!Number.isSafeInteger(total) || total <= 0 || total !== toCents(snapshot.total)) throw new Error('Order total mismatch');
  return total;
}

async function requestJson(fetcher, url, options, provider) {
  let response;
  try { response = await fetcher(url, { ...options, signal: AbortSignal.timeout(15000) }); }
  catch { throw new Error(`${provider} request outcome unknown; reconcile before retrying`); }
  if (!response.ok) throw new Error(`${provider} rejected request (${response.status})`);
  return response.json();
}

function checkoutUrl(value, provider) {
  const url = new URL(value);
  const allowed = provider === 'stripe'
    ? url.hostname === 'checkout.stripe.com'
    : ['mercadopago.com.mx', 'mercadopago.com'].some(host => url.hostname === host || url.hostname.endsWith('.' + host));
  if (!allowed || url.protocol !== 'https:' || url.username || url.password) throw new Error('Unexpected hosted checkout URL');
  return url.href;
}

// Consume only the snapshot returned by server-side order persistence, never browser prices.
export async function createStripeCheckout(snapshot, config, fetcher = fetch) {
  validateSnapshot(snapshot);
  if (!config.secretKey || !config.webhookSecret) throw new Error('Stripe is not configured');
  const origin = originUrl(config.siteOrigin);
  const body = new URLSearchParams({ mode: 'payment', client_reference_id: snapshot.reference,
    'metadata[order_reference]': snapshot.reference,
    success_url: `${origin}/?payment=return`, cancel_url: `${origin}/?payment=cancelled`,
  });
  snapshot.items.forEach((line, index) => {
    body.set(`line_items[${index}][quantity]`, String(line.quantity));
    body.set(`line_items[${index}][price_data][currency]`, 'mxn');
    body.set(`line_items[${index}][price_data][unit_amount]`, String(toCents(line.price)));
    body.set(`line_items[${index}][price_data][product_data][name]`, line.name);
  });
  const session = await requestJson(fetcher, 'https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST', headers: { Authorization: `Bearer ${config.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `checkout-${snapshot.reference}` }, body,
  }, 'Stripe');
  if (!session.id) throw new Error('Stripe session ID missing');
  return { sessionId: String(session.id), url: checkoutUrl(session.url, 'stripe') };
}

export async function createMercadoPagoCheckout(snapshot, config, fetcher = fetch) {
  validateSnapshot(snapshot);
  if (!config.accessToken || !config.webhookSecret || typeof config.sandbox !== 'boolean') throw new Error('Mercado Pago is not configured');
  const origin = originUrl(config.siteOrigin);
  const body = {
    external_reference: snapshot.reference,
    items: snapshot.items.map(line => ({ id: String(line.productId), title: line.name, quantity: line.quantity, currency_id: 'MXN', unit_price: toCents(line.price) / 100 })),
    back_urls: { success: `${origin}/?payment=return`, pending: `${origin}/?payment=pending`, failure: `${origin}/?payment=cancelled` },
    auto_return: 'approved', notification_url: `${origin}/api/payments/mercadopago/webhook`,
  };
  const preference = await requestJson(fetcher, 'https://api.mercadopago.com/checkout/preferences', {
    method: 'POST', headers: { Authorization: `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }, 'Mercado Pago');
  if (!preference.id) throw new Error('Mercado Pago preference ID missing');
  // Preferences API does not promise request idempotency: caller must persist
  // the attempt before POST and reconcile ambiguous failures instead of retrying.
  return { sessionId: String(preference.id), url: checkoutUrl(config.sandbox ? preference.sandbox_init_point : preference.init_point, 'mercadopago') };
}

export async function fetchMercadoPagoPayment(paymentId, accessToken, fetcher = fetch) {
  if (!accessToken || !/^\d+$/.test(String(paymentId))) throw new Error('Invalid payment lookup');
  return requestJson(fetcher, `https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }, 'Mercado Pago');
}

export function isSettledPayment(provider, payment, snapshot) {
  validateSnapshot(snapshot);
  try {
    if (provider === 'stripe') return payment.payment_status === 'paid' && payment.currency === 'mxn'
      && payment.client_reference_id === snapshot.reference && payment.amount_total === toCents(snapshot.total)
      && payment.id === snapshot.sessionId;
    if (provider === 'mercadopago') return payment.status === 'approved' && payment.currency_id === 'MXN'
      && payment.external_reference === snapshot.reference && toCents(payment.transaction_amount) === toCents(snapshot.total)
      && Number(payment.transaction_amount_refunded ?? 0) === 0;
  } catch { return false; }
  return false;
}
