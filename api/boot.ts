import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { receiveStripeWebhook } from "./lib/stripe-webhook-handler";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import {
  handleGoogleStart, handleGoogleCallback,
  handleFacebookStart, handleFacebookCallback,
  handleTwitterStart, handleTwitterCallback,
} from "./social-auth";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Kimi OAuth (legacy)
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// Google OAuth
app.get("/api/oauth/google", handleGoogleStart);
app.get("/api/oauth/google/callback", handleGoogleCallback);

// Facebook OAuth
app.get("/api/oauth/facebook", handleFacebookStart);
app.get("/api/oauth/facebook/callback", handleFacebookCallback);

// Twitter / X OAuth
app.get("/api/oauth/twitter", handleTwitterStart);
app.get("/api/oauth/twitter/callback", handleTwitterCallback);

// VPS Node/Hono Stripe endpoint. Verify the signature against the untouched raw body.
// This route must run before the catch-all /api/* handler.
app.post("/api/stripe-webhook", async (c) => {
  try {
    const payload = new Uint8Array(await c.req.arrayBuffer());
    const accepted = await receiveStripeWebhook(
      payload,
      c.req.header("stripe-signature"),
    );
    if (!accepted) return c.json({ error: "Invalid Stripe webhook signature or configuration" }, 400);
    return c.json({ received: true }, 200);
  } catch (error) {
    console.error("[stripe-webhook] processing failed", error instanceof Error ? error.message : "unknown");
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

// tRPC
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);
  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
