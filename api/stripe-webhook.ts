import type { VercelRequest, VercelResponse } from "@vercel/node";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { orders } from "@db/schema";
import { getStripe } from "./lib/stripe";
import { getDb } from "./queries/connection";

export const config = { api: { bodyParser: false } };

async function rawBody(req: VercelRequest) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (typeof signature !== "string" || !webhookSecret) {
    return res.status(400).json({ error: "Webhook no configurado" });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await rawBody(req), signature, webhookSecret);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Firma inválida" });
  }

  const db = getDb();
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = Number(session.metadata?.orderId);
    if (Number.isSafeInteger(orderId) && session.payment_status === "paid") {
      await db.update(orders).set({
        paymentStatus: "paid",
        status: "processing",
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        shippingAddress: session.collected_information?.shipping_details
          ? JSON.stringify(session.collected_information.shipping_details)
          : null,
      }).where(eq(orders.id, orderId));
    }
  } else if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = Number(session.metadata?.orderId);
    if (Number.isSafeInteger(orderId)) {
      await db.update(orders).set({ paymentStatus: "failed" }).where(eq(orders.id, orderId));
    }
  } else if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const orderId = Number(charge.metadata?.orderId);
    if (Number.isSafeInteger(orderId)) {
      await db.update(orders).set({ paymentStatus: "refunded", status: "cancelled" }).where(eq(orders.id, orderId));
    }
  }

  return res.status(200).json({ received: true });
}
