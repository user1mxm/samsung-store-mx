export function paymentConfig(provider: 'stripe' | 'mercadopago') {
  if (process.env.PAYMENTS_ENABLED !== '1') return null;
  const siteOrigin = process.env.SITE_ORIGIN || 'https://samsungstore.com.mx';
  try {
    const url = new URL(siteOrigin);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
  } catch { return null; }
  if (provider === 'stripe') {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    return secretKey && webhookSecret ? { secretKey, webhookSecret, siteOrigin } : null;
  }
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const mode = process.env.MERCADOPAGO_MODE;
  return accessToken && webhookSecret && (mode === 'sandbox' || mode === 'live')
    ? { accessToken, webhookSecret, siteOrigin, sandbox: mode === 'sandbox' } : null;
}
