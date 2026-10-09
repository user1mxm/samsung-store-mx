import { env } from "./env";
import { hashPassword, verifyPassword as verify, isLegacyHash } from "./password-core.mjs";
export { hashPassword, isLegacyHash };
export function verifyPassword(password: string, stored: string | null) {
  return verify(password, stored, env.appSecret);
}
