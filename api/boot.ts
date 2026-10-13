import { registerSecurity } from './commerce/security';
import { registerCommerceHttp } from './commerce/http';
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { compress } from "hono/compress";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import { registerPaymentWebhooks } from "./payments/webhooks";
import {
  handleGoogleStart, handleGoogleCallback,
  handleFacebookStart, handleFacebookCallback,
  handleTwitterStart, handleTwitterCallback,
} from "./social-auth";

import { handleUpload, handleServeUpload } from "./upload";

const app = new Hono<{ Bindings: HttpBindings }>();

registerSecurity(app);
app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.use("/api/trpc/*",bodyLimit({maxSize:1024*1024}));
registerCommerceHttp(app);
registerPaymentWebhooks(app);

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

app.post("/api/upload", handleUpload);
app.get(`${env.uploadPublicPath}/*`, handleServeUpload);

// tRPC
app.use("/api/trpc/*", async (c, next) => {
  const acceptsGzip = (c.req.header("Accept-Encoding") ?? "").split(",").some(part => {
    const [encoding, ...params] = part.trim().split(";");
    const quality = params.find(p => p.trim().startsWith("q="));
    return encoding === "gzip" && (!quality || Number(quality.trim().slice(2)) > 0);
  });
  if (acceptsGzip) await compress({ encoding: "gzip" })(c, next);
  else await next();
  c.header("Cache-Control", "private, no-store");
  c.header("Vary", "Accept-Encoding");
});
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
  serve({ fetch: app.fetch, port, hostname: process.env.BIND_HOST || undefined }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
