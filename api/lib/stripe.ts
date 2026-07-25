import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe no está configurado. Falta STRIPE_SECRET_KEY.");
  }

  stripeClient ??= new Stripe(secretKey, {
    maxNetworkRetries: 2,
    typescript: true,
  });
  return stripeClient;
}
