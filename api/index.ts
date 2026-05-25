import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { createOAuthCallbackHandler } from "./kimi/auth";
import {
  handleGoogleStart,
  handleGoogleCallback,
  handleFacebookStart,
  handleFacebookCallback,
  handleTwitterStart,
  handleTwitterCallback,
} from "./social-auth";
import { Paths } from "@contracts/constants";
import * as fs from "node:fs";
import * as path from "node:path";

const app = new Hono();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Kimi OAuth
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// Social OAuth – initiation
app.get("/api/auth/google", (c) => handleGoogleStart(c));
app.get("/api/auth/facebook", (c) => handleFacebookStart(c));
app.get("/api/auth/twitter", (c) => handleTwitterStart(c));

// Social OAuth – callbacks
app.get("/api/oauth/google/callback", (c) => handleGoogleCallback(c));
app.get("/api/oauth/facebook/callback", (c) => handleFacebookCallback(c));
app.get("/api/oauth/twitter/callback", (c) => handleTwitterCallback(c));
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

// SPA fallback — serve index.html for all non-API routes
app.get("/*", async (c) => {
  const reqPath = c.req.path;
  const filePath = reqPath === "/" ? "/index.html" : reqPath;
  const fullPath = path.join(process.cwd(), "dist/public", filePath);
  
  const contentTypes: Record<string, string> = {
    html: "text/html",
    js: "application/javascript",
    css: "text/css",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    svg: "image/svg+xml",
    webp: "image/webp",
    ico: "image/x-icon",
    woff2: "font/woff2",
    ttf: "font/ttf",
  };
  const ext = path.extname(filePath).slice(1);

  try {
    const file = fs.readFileSync(fullPath);
    c.header("Content-Type", contentTypes[ext] || "application/octet-stream");
    return c.body(file);
  } catch {
    // SPA fallback
    const indexPath = path.join(process.cwd(), "dist/public/index.html");
    const indexHtml = fs.readFileSync(indexPath);
    c.header("Content-Type", "text/html");
    return c.body(indexHtml);
  }
});

// Vercel serverless handler — compatible with both Vercel Functions and local dev
export default async function handler(
  req: { method?: string; url?: string; headers?: Record<string, string | string[]>; body?: any },
  res: { status: (code: number) => any; setHeader: (key: string, value: string) => any; send: (body: string) => any }
) {
  const host = Array.isArray(req.headers?.host) ? req.headers.host[0] : req.headers?.host || "localhost";
  const url = new URL(req.url || "/", `http://${host}`);
  
  const headers = new Headers();
  if (req.headers) {
    Object.entries(req.headers).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach(val => headers.append(k, val));
      else if (v) headers.set(k, v);
    });
  }

  const requestInit: RequestInit = {
    method: req.method || "GET",
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" && req.body ? JSON.stringify(req.body) : undefined,
  };

  const request = new Request(url.toString(), requestInit);
  const response = await app.fetch(request);

  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  
  const body = await response.text();
  res.send(body);
}

// Also support direct export for Vercel edge/standard
export const config = {
  runtime: "nodejs",
};
