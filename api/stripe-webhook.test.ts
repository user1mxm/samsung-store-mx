import { beforeEach, describe, expect, it } from "vitest";
import Stripe from "stripe";
import app from "./boot";

const secret = "whsec_local_webhook_test";
const stripe = new Stripe("sk_test_local_webhook_test");

describe("VPS Stripe webhook ingress", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test_local_webhook_test";
    process.env.STRIPE_WEBHOOK_SECRET = secret;
  });

  it("rejects an unsigned POST", async () => {
    const response = await app.request("/api/stripe-webhook", {
      method: "POST",
      body: JSON.stringify({ type: "customer.updated" }),
      headers: { "content-type": "application/json" },
    });
    expect(response.status).toBe(400);
  });

  it("rejects a forged signature", async () => {
    const response = await app.request("/api/stripe-webhook", {
      method: "POST",
      body: JSON.stringify({ type: "customer.updated" }),
      headers: { "stripe-signature": "t=1,v1=invalid", "content-type": "application/json" },
    });
    expect(response.status).toBe(400);
  });

  it("accepts a correctly signed event without needing a DB for unrelated event types", async () => {
    const body = JSON.stringify({
      id: "evt_local_test",
      object: "event",
      type: "customer.updated",
      data: { object: { id: "cus_local", object: "customer" } },
    });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload: body,
      secret,
    });

    const response = await app.request("/api/stripe-webhook", {
      method: "POST",
      headers: { "stripe-signature": signature, "content-type": "application/json" },
      body,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
  });
});
