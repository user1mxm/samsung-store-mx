// @ts-nocheck
import { and, eq, desc } from "drizzle-orm";
import { env } from "./env";
import { getDb } from "../queries/connection";
import { phoneOtps } from "@db/schema";
import { sendOtpEmail } from "./email";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export type OtpPurpose = "register" | "login";

/** Normalise a phone number to E.164-ish (digits + leading +). Defaults to MX (+52). */
export function normalizePhone(raw: string): string {
  let p = (raw || "").trim().replace(/[\s\-().]/g, "");
  if (p.startsWith("00")) p = "+" + p.slice(2);
  if (!p.startsWith("+")) {
    const digits = p.replace(/\D/g, "");
    p = digits.length === 10 ? `+52${digits}` : `+${digits}`;
  }
  return p;
}

function generateCode(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

const verifyConfigured = () => !!(env.twilioAccountSid && env.twilioAuthToken && env.twilioVerifyServiceSid);
const messagesConfigured = () => !!(env.twilioAccountSid && env.twilioAuthToken && env.twilioFromNumber);

function twilioAuthHeader(): string {
  return "Basic " + Buffer.from(`${env.twilioAccountSid}:${env.twilioAuthToken}`).toString("base64");
}

// ── Twilio Verify API (managed codes) ────────────────────────────────────────
async function verifyStart(phone: string) {
  const url = `https://verify.twilio.com/v2/Services/${env.twilioVerifyServiceSid}/Verifications`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: twilioAuthHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: phone, Channel: "sms" }),
  });
  if (!res.ok) throw new Error(`Twilio Verify start failed: ${res.status} ${await res.text()}`);
}

async function verifyCheck(phone: string, code: string): Promise<boolean> {
  const url = `https://verify.twilio.com/v2/Services/${env.twilioVerifyServiceSid}/VerificationCheck`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: twilioAuthHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: phone, Code: code }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { status?: string };
  return data.status === "approved";
}

// ── Twilio Messages API (self-managed codes) ─────────────────────────────────
async function sendSms(phone: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.twilioAccountSid}/Messages.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: twilioAuthHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: phone, From: env.twilioFromNumber, Body: body }),
  });
  if (!res.ok) throw new Error(`Twilio SMS failed: ${res.status} ${await res.text()}`);
}

/**
 * Request an OTP for a phone number. Returns { delivery } describing how it was sent.
 * - "twilio-verify": Twilio managed the code (nothing stored locally).
 * - "sms": we generated + stored a code and sent it via SMS.
 * - "dev": no provider configured; code stored + logged (and emailed if an email is given).
 */
export async function requestOtp(
  phoneRaw: string,
  purpose: OtpPurpose,
  fallbackEmail?: string | null,
): Promise<{ delivery: "twilio-verify" | "sms" | "dev"; devCode?: string }> {
  const phone = normalizePhone(phoneRaw);
  const db = getDb();

  if (verifyConfigured()) {
    await verifyStart(phone);
    return { delivery: "twilio-verify" };
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await db.insert(phoneOtps).values({ phone, code, purpose, expiresAt });

  if (messagesConfigured()) {
    await sendSms(phone, `Samsung Store MX: tu código de verificación es ${code}. Expira en 10 min.`);
    return { delivery: "sms" };
  }

  // Dev fallback: log and optionally email so the flow is fully testable without a provider.
  console.warn(`[sms] No SMS provider configured. OTP for ${phone} = ${code}`);
  if (fallbackEmail) {
    try { await sendOtpEmail(fallbackEmail, code); } catch (e) { console.error("[sms] OTP email fallback failed", e); }
  }
  return { delivery: "dev", devCode: env.isProduction ? undefined : code };
}

/** Verify an OTP. Returns true on success and consumes the code. */
export async function checkOtp(phoneRaw: string, code: string): Promise<boolean> {
  const phone = normalizePhone(phoneRaw);

  if (verifyConfigured()) {
    return verifyCheck(phone, code);
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(phoneOtps)
    .where(and(eq(phoneOtps.phone, phone), eq(phoneOtps.consumed, false)))
    .orderBy(desc(phoneOtps.createdAt))
    .limit(1);

  const otp = rows[0];
  if (!otp) return false;
  if (otp.attempts >= MAX_ATTEMPTS) return false;
  if (new Date() > new Date(otp.expiresAt)) return false;

  if (otp.code !== code) {
    await db.update(phoneOtps).set({ attempts: otp.attempts + 1 }).where(eq(phoneOtps.id, otp.id));
    return false;
  }

  await db.update(phoneOtps).set({ consumed: true }).where(eq(phoneOtps.id, otp.id));
  return true;
}
