// Local demonstration only. This module never calls payment providers or changes orders.
export const DEMO_PROVIDERS = Object.freeze(['stripe', 'mercadopago']);
export const DEMO_OUTCOMES = Object.freeze(['approved', 'declined', 'pending']);

export function demoPaymentResult({ provider, outcome, amountCents, reference }) {
  if (!DEMO_PROVIDERS.includes(provider)) throw new Error('Proveedor de simulación inválido');
  if (!DEMO_OUTCOMES.includes(outcome)) throw new Error('Resultado de simulación inválido');
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || amountCents > 999999999) {
    throw new Error('Importe de demostración inválido');
  }
  if (typeof reference !== 'string' || !/^[a-f0-9-]{8,36}$/i.test(reference)) {
    throw new Error('Referencia de demostración inválida');
  }
  return Object.freeze({
    kind: 'simulation_only',
    provider,
    outcome,
    reference: 'DEMO-' + reference.toUpperCase(),
    currency: 'MXN',
    amountCents,
    charged: false,
    paid: false,
    persisted: false,
    orderId: null,
    providerSessionId: null,
    webhookEventId: null,
  });
}

export function demoAmountCents(amountMXN) {
  if (typeof amountMXN !== 'number' || !Number.isFinite(amountMXN) || amountMXN <= 0) {
    throw new Error('Importe de demostración inválido');
  }
  const cents = Math.round(amountMXN * 100);
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 999999999 ||
      Math.abs(amountMXN * 100 - cents) > 0.00001) {
    throw new Error('Importe de demostración inválido');
  }
  return cents;
}
