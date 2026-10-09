import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";

type App = Hono<{ Bindings: HttpBindings }>;

export function serveStaticFiles(app: App) {
  // This module is bundled into dist/boot.js in production.
  const distPath = path.resolve(import.meta.dirname, "public");

  app.use("*", serveStatic({ root: distPath, precompressed: true, onFound: (file, c) => {
    const relative = path.relative(distPath, file);
    c.header("Cache-Control", /^(assets|media)[/\\]/.test(relative)
      ? "public, max-age=31536000, immutable"
      : file.replace(/\.(br|gz|zst)$/, "").endsWith(".html") ? "no-cache" : "public, max-age=3600");
    c.header("X-Content-Type-Options", "nosniff");
  } }));

  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) {
      return c.json({ error: "Not Found" }, 404);
    }
    const indexPath = path.resolve(distPath, "index.html");
    const content = fs.readFileSync(indexPath, "utf-8");
    c.header("Cache-Control", "no-cache");
    return c.html(content);
  });
}
