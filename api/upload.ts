// @ts-nocheck
import type { Context } from "hono";
import * as fs from "node:fs";
import * as cookie from "cookie";
import { eq } from "drizzle-orm";
import { Session } from "@contracts/constants";
import { verifySessionToken } from "./kimi/session";
import { authenticateRequest } from "./kimi/auth";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { saveImage, resolveUploadPath } from "./lib/storage";
import { env } from "./lib/env";

/** Resolve the authenticated user from a request (local/social/phone session or Kimi). */
async function getRequestUser(headers: Headers) {
  // Local / social / phone session cookie
  try {
    const cookies = cookie.parse(headers.get("cookie") || "");
    const token = cookies[Session.cookieName];
    if (token) {
      const claim = await verifySessionToken(token);
      if (claim?.unionId) {
        const db = getDb();
        let rows;
        if (claim.unionId.startsWith("local-")) {
          const id = parseInt(claim.unionId.replace("local-", ""), 10);
          rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
        } else {
          rows = await db.select().from(users).where(eq(users.unionId, claim.unionId)).limit(1);
        }
        if (rows?.[0]) return rows[0];
      }
    }
  } catch { /* fall through */ }

  // Kimi OAuth
  try {
    return await authenticateRequest(headers);
  } catch {
    return null;
  }
}

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", gif: "image/gif", avif: "image/avif",
};

/** POST /api/upload — admin only. Accepts multipart form-data with one or more "files". */
export async function handleUpload(c: Context) {
  const user = await getRequestUser(c.req.raw.headers);
  if (!user) return c.json({ error: "Authentication required" }, 401);
  if (user.role !== "admin") return c.json({ error: "Insufficient permissions" }, 403);

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return c.json({ error: "Invalid form data" }, 400);
  }

  const entries = [...form.getAll("files"), ...form.getAll("file")].filter(
    (f): f is File => typeof f === "object" && f !== null && "arrayBuffer" in f,
  );
  if (entries.length === 0) return c.json({ error: "No se recibió ningún archivo" }, 400);

  const urls: string[] = [];
  const errors: string[] = [];
  for (const file of entries) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await saveImage({ name: file.name, type: file.type, size: buffer.length, buffer });
      urls.push(url);
    } catch (err: any) {
      errors.push(`${file.name}: ${err.message}`);
    }
  }

  if (urls.length === 0) return c.json({ error: errors.join("; ") || "Subida fallida" }, 400);
  return c.json({ success: true, urls, url: urls[0], errors });
}

/** GET /uploads/* — serve files saved to disk (skipped automatically when using S3). */
export async function handleServeUpload(c: Context) {
  const filename = c.req.path.replace(`${env.uploadPublicPath}/`, "").replace(/^\//, "");
  const full = resolveUploadPath(filename);
  if (!full) return c.notFound();
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const data = fs.readFileSync(full);
  c.header("Content-Type", CONTENT_TYPES[ext] || "application/octet-stream");
  c.header("Cache-Control", "public, max-age=31536000, immutable");
  return c.body(data);
}
