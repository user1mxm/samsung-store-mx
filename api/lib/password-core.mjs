import { scrypt as _scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt);
const KEYLEN = 64;
const PREFIX = "scrypt";

/**
 * Hash a password with a per-user random salt using scrypt (real, slow KDF).
 * Stored format:  scrypt$<saltHex>$<hashHex>
 */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, KEYLEN));
  return `${PREFIX}$${salt}$${derived.toString("hex")}`;
}

/**
 * Legacy hash used before scrypt was introduced: SHA-256(password + APP_SECRET).
 * Kept ONLY so previously-created accounts (e.g. the seeded admin) keep working.
 */
async function legacyHash(password, appSecret) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + appSecret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verify a plaintext password against a stored hash.
 * Transparently supports both the new scrypt format and the legacy SHA-256 hash.
 */
export async function verifyPassword(password, stored, appSecret) {
  if (!stored) return false;

  if (stored.startsWith(`${PREFIX}$`)) {
    const [, salt, hashHex] = stored.split("$");
    if (!salt || !hashHex) return false;
    const derived = (await scrypt(password, salt, KEYLEN));
    const expected = Buffer.from(hashHex, "hex");
    if (expected.length !== derived.length) return false;
    return timingSafeEqual(expected, derived);
  }

  // Legacy fallback
  const legacy = await legacyHash(password, appSecret);
  if (legacy.length !== stored.length) return false;
  return timingSafeEqual(Buffer.from(legacy), Buffer.from(stored));
}

/** True when a stored hash is still in the old format and should be upgraded on next login. */
export function isLegacyHash(stored) {
  return !!stored && !stored.startsWith(`${PREFIX}$`);
}
