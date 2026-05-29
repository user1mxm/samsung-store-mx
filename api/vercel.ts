// @ts-nocheck
// api/vercel.ts — Vercel serverless entry (wraps the Hono app via hono/vercel).
// Vercel detects files in /api as serverless functions. This re-exports the
// existing Hono app so /api/* routes work on Vercel without a long-lived server.
//
// NOTE: This app was built for a Node host (HostGator). On Vercel it runs as a
// serverless function. MySQL on shared hosting (HostGator) may reject or throttle
// connections from Vercel's serverless IPs — use a serverless-friendly MySQL
// (PlanetScale, Vercel Postgres via adapter, or allowlist Vercel egress) for
// production reliability. See DEPLOY-VERCEL.md.
import { handle } from "hono/vercel";
import app from "./boot";

export const config = { runtime: "nodejs" };

export default handle(app);
