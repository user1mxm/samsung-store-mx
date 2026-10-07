import type { VercelRequest, VercelResponse } from "@vercel/node";
import { receiveStripeWebhook } from "./lib/stripe-webhook-handler";

export const config = { api: { bodyParser: false } };

async function rawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

// Keep Vercel support while sharing the same signature checks and DB transitions
// as the self-hosted Hono route.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const signature = req.headers["stripe-signature"];
  try {
    const accepted = await receiveStripeWebhook(
      await rawBody(req),
      typeof signature === "string" ? signature : undefined,
    );
    if (!accepted) return res.status(400).json({ error: "Invalid Stripe webhook signature or configuration" });
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[stripe-webhook] processing failed", error instanceof Error ? error.message : "unknown");
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
