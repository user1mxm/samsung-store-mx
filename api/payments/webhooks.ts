// @ts-nocheck
import { getOrderPool } from '../queries/connection';
import { paymentConfig } from './config';
import { verifyStripeSignature, verifyMercadoPagoSignature, fetchMercadoPagoPayment } from './providers.mjs';
import { settleCheckout } from './checkout-service.mjs';

export function registerPaymentWebhooks(app) {
  app.post('/api/payments/stripe/webhook', async c => {
    const config = paymentConfig('stripe');
    if (!config) return c.json({ error: 'Payments unavailable' }, 503);
    const raw = Buffer.from(await c.req.arrayBuffer());
    if (!verifyStripeSignature(raw, c.req.header('stripe-signature'), config.webhookSecret)) return c.json({ error: 'Invalid signature' }, 401);
    let event;
    try { event = JSON.parse(raw.toString('utf8')); } catch { return c.json({ error: 'Invalid notification' }, 400); }
    if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type) || event.data?.object?.payment_status !== 'paid') return c.json({ received: true });
    if (typeof event.id !== 'string' || event.id.length > 255) return c.json({ error: 'Invalid event' }, 400);
    try { await settleCheckout(getOrderPool(), 'stripe', event.id, event.data.object); }
    catch { return c.json({ error: 'Settlement not recorded; notification must be retried or reviewed' }, 503); }
    return c.json({ received: true });
  });

  app.post('/api/payments/mercadopago/webhook', async c => {
    const config = paymentConfig('mercadopago');
    if (!config) return c.json({ error: 'Payments unavailable' }, 503);
    const paymentId = c.req.query('data.id');
    if (!verifyMercadoPagoSignature(paymentId, c.req.header('x-request-id'), c.req.header('x-signature'), config.webhookSecret)) return c.json({ error: 'Invalid signature' }, 401);
    // Retrieve the signed payment id from the fixed provider API; ignore body status.
    try {
      const payment = await fetchMercadoPagoPayment(paymentId, config.accessToken);
      if (payment.status !== 'approved') return c.json({ received: true });
      await settleCheckout(getOrderPool(), 'mercadopago', `${payment.id}:approved`, payment);
    } catch { return c.json({ error: 'Settlement not recorded; notification must be retried or reviewed' }, 503); }
    return c.json({ received: true });
  });
}
