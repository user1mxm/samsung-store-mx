// @ts-nocheck
import * as fs from "node:fs";
import * as path from "node:path";
import { randomBytes } from "node:crypto";
import { env } from "./env";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export const ALLOWED_IMAGE_MIME = Object.keys(EXT_BY_MIME);

function safeExt(filename: string, mime: string): string {
  const fromMime = EXT_BY_MIME[mime];
  if (fromMime) return fromMime;
  const ext = path.extname(filename || "").slice(1).toLowerCase();
  return ext && /^[a-z0-9]{2,5}$/.test(ext) ? ext : "bin";
}

function uniqueName(filename: string, mime: string): string {
  const ext = safeExt(filename, mime);
  const stamp = Date.now().toString(36);
  const rand = randomBytes(6).toString("hex");
  return `${stamp}-${rand}.${ext}`;
}

const useS3 = () => !!env.s3Bucket;

async function saveToS3(key: string, body: Buffer, mime: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: env.s3Region,
    endpoint: env.s3Endpoint || undefined,
    credentials:
      env.s3AccessKeyId && env.s3SecretAccessKey
        ? { accessKeyId: env.s3AccessKeyId, secretAccessKey: env.s3SecretAccessKey }
        : undefined,
  });
  await client.send(
    new PutObjectCommand({ Bucket: env.s3Bucket, Key: key, Body: body, ContentType: mime }),
  );
  const base = env.s3PublicUrl || `https://${env.s3Bucket}.s3.${env.s3Region}.amazonaws.com`;
  return `${base.replace(/\/$/, "")}/${key}`;
}

function saveToDisk(name: string, body: Buffer): string {
  const dir = path.resolve(env.uploadDir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), body);
  return `${env.uploadPublicPath.replace(/\/$/, "")}/${name}`;
}

/** Persist an uploaded image. Returns the public URL. Throws on invalid type/size. */
export async function saveImage(file: { name: string; type: string; size: number; buffer: Buffer }): Promise<string> {
  if (!ALLOWED_IMAGE_MIME.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type || "desconocido"}`);
  }
  if (file.size > env.maxUploadBytes) {
    throw new Error(`Archivo demasiado grande (máx ${(env.maxUploadBytes / 1024 / 1024).toFixed(0)}MB)`);
  }
  const name = uniqueName(file.name, file.type);
  if (useS3()) return saveToS3(`products/${name}`, file.buffer, file.type);
  return saveToDisk(name, file.buffer);
}

/** Resolve the absolute on-disk path for a stored upload (disk mode only). */
export function resolveUploadPath(filename: string): string | null {
  const clean = path.basename(filename); // prevent traversal
  const full = path.join(path.resolve(env.uploadDir), clean);
  return fs.existsSync(full) ? full : null;
}
