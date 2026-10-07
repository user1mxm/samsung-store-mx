import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { orders } from "@db/schema";
import { getStripe } from "./stripe";
import { getDb } from "../queries/connection";

/**
 * Shared signed-webhook handling for the VPS Hono server and Vercel.
 * Never parse and reserialize the body before signature verification.
 * Throw on database errors so Stripe can retry the delivery.
 */
export async function receiveStripeWebhook(
  payload: Uint8Array,
  signature: string | undefined,
): Promise<boolean> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return false;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      Buffer.from(payload),
      signature,
      secret,
    );
  } catch {
    return false;
  }

  await applyStripeEvent(event);
  return true;
}

export async function applyStripeEvent(event: Stripe.Event): Promise<void> {
  if (event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = Number(session.metadata?.orderId);
    if (!Number.isSafeInteger(orderId) || orderId <= 0 || session.payment_status !== "paid") return;

    // The checkout session must already be attached to the order by createCheckout.
    // Only unpaid orders may transition; replayed events or late events after refunds are no-ops.
    await getDb().update(orders).set({
      paymentStatus: "paid",
      status: "processing",
      stripePaymentIntentId: typeof session.payment_intent === "string"
        ? session.payment_intent : (session.payment_intent?.id ?? null),
      shippingAddress: session.collected_information?.shipping_details
        ? JSON.stringify(session.collected_information.shipping_details)
        : null,
    }).where(and(
      eq(orders.id, orderId),
      eq(orders.stripeCheckoutSessionId, session.id),
      eq(orders.paymentStatus, "unpaid"),
    ));
    return;
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = Number(session.metadata?.orderId);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) return;
    await getDb().update(orders).set({ paymentStatus: "failed" })
      .where(and(
        eq(orders.id, orderId),
        eq(orders.stripeCheckoutSessionId, session.id),
        eq(orders.paymentStatus, "unpaid"),
      ));
    return;
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const orderId = Number(charge.metadata?.orderId);
    const paymentIntentId = typeof charge.payment_intent === "string"
      ? charge.payment_intent : charge.payment_intent?.id;

    // Stripe does not guarantee metadata copied onto Charge from PaymentIntent.
    // Match the PaymentIntent recorded from a completed checkout whenever possible.
    if (paymentIntentId) {
      await getDb().update(orders)
        .set({ paymentStatus: "refunded", status: "cancelled" })
        .where(and(
          eq(orders.stripePaymentIntentId, paymentIntentId),
          eq(orders.paymentStatus, "paid"),
        ));
    } else if (Number.isSafeInteger(orderId) && orderId > 0) {
      await getDb().update(orders)
        .set({ paymentStatus: "refunded", status: "cancelled" })
        .where(and(
          eq(orders.id, orderId),
          eq(orders.paymentStatus, "paid"),
        ));
    }
  }
}
