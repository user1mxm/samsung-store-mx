// @ts-nocheck
import type { Context } from "hono";
import { setCookie, getCookie } from "hono/cookie";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { env } from "./lib/env";
import { getSessionCookieOptions } from "./lib/cookies";
import { Session } from "@contracts/constants";
import { signSessionToken } from "./kimi/session";
import { getDb } from "./queries/connection";
import { users, referrals, agents } from "@db/schema";
import { sendWelcomeClient, sendWelcomeAgent, notifyAdminNewUser } from "./lib/mailer";
import { sql } from "drizzle-orm";

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildOrigin(c: Context): string {
  const proto = c.req.header("x-forwarded-proto") ?? "https";
  const host = c.req.header("host") ?? "samsungstore.com.mx";
  return `${proto}://${host}`;
}

function encodeState(provider: string, role: string, oauthState: string): string {
  return btoa(JSON.stringify({ provider, role, state: oauthState }));
}

function decodeState(raw: string): { provider: string; role: string; state: string } | null {
  try {
    return JSON.parse(atob(raw));
  } catch {
    return null;
  }
}

async function issueSession(c: Context, userId: number) {
  const token = await signSessionToken({ unionId: `local-${userId}`, clientId: env.appId });
  const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
  setCookie(c, Session.cookieName, token, { ...cookieOpts, maxAge: Session.maxAgeMs / 1000 });
}

async function upsertSocialUser(params: {
  providerUserId: string;
  provider: "google" | "facebook" | "twitter";
  name: string;
  email: string | null;
  avatar: string | null;
  role: "client" | "agent";
}): Promise<{userId:number;isNew:boolean;name:string;email:string}> {
  const db = getDb();
  const unionId = `${params.provider}-${params.providerUserId}`;
  const email = params.email ?? `${unionId}@oauth.local`;

  const existing = await db.select().from(users).where(eq(users.unionId, unionId)).limit(1);
  if (existing.length > 0) {
    await db.update(users).set({ lastSignInAt: new Date(), avatar: params.avatar ?? existing[0].avatar }).where(eq(users.unionId, unionId));
    return { userId: Number(existing[0].id), isNew: false, name: existing[0].name, email: existing[0].email ?? email };
  }

  const [result] = await db.insert(users).values({
    unionId,
    name: params.name,
    email,
    avatar: params.avatar,
    provider: params.provider,
    role: params.role,
    emailVerified: !!params.email,
    mustChangePassword: false,
  });
  const userId = Number(result.insertId);
  // Auto-create referral profile
  try {
    const code = "SAM" + Math.random().toString(36).substring(2, 8).toUpperCase();
    await db.insert(referrals).values({ userId, referralCode: code, level: 1 });
    if (params.role === "agent") {
      await db.insert(agents).values({ userId, code: `AGENT-${String(userId).padStart(3,"0")}`, specialty:"General", status:"online" });
    }
  } catch {}
  return { userId, isNew: true, name: params.name, email };
}

// ── Google ────────────────────────────────────────────────────────────────────

export function handleGoogleStart(c: Context) {
  const role = (c.req.query("role") as string) || "client";
  const origin = buildOrigin(c);
  const redirectUri = `${origin}/api/oauth/google/callback`;
  const oauthState = nanoid(16);
  const state = encodeState("google", role, oauthState);

  setCookie(c, "oauth_state", state, { httpOnly: true, path: "/", maxAge: 600 });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.googleClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "online");

  return c.redirect(url.toString(), 302);
}

export async function handleGoogleCallback(c: Context) {
  const code = c.req.query("code");
  const stateParam = c.req.query("state");
  const savedState = getCookie(c, "oauth_state");

  if (!code || !stateParam || stateParam !== savedState) {
    return c.redirect("/login?error=oauth_failed", 302);
  }

  const decoded = decodeState(stateParam);
  if (!decoded) return c.redirect("/login?error=oauth_failed", 302);

  const origin = buildOrigin(c);
  const redirectUri = `${origin}/api/oauth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.googleClientId,
        client_secret: env.googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) throw new Error("Google token exchange failed");
    const tokenData = await tokenRes.json() as { access_token: string };

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileRes.ok) throw new Error("Google profile fetch failed");
    const profile = await profileRes.json() as { sub: string; name: string; email: string; picture: string };

    const role = (decoded.role === "agent" ? "agent" : "client") as "client" | "agent";
    const result = await upsertSocialUser({
      providerUserId: profile.sub,
      provider: "google",
      name: profile.name,
      email: profile.email,
      avatar: profile.picture,
      role,
    });

    const { userId, isNew, name: uName, email: uEmail } = result;
    const { userId, isNew, name: uName, email: uEmail } = result;
    const { userId, isNew, name: uName, email: uEmail } = result;
    await issueSession(c, userId);
    if (isNew) {
      const _role = (decoded.role === "agent" ? "agent" : "client") as string;
      setImmediate(async () => {
        try {
          const { getDb: _db2 } = await import("./queries/connection");
          const { referrals: _refs } = await import("../db/schema");
          const { eq: _eq2 } = await import("drizzle-orm");
          if (_role === "agent") {
            const ref = await _db2().select().from(_refs).where(_eq2(_refs.userId, userId)).limit(1);
            await sendWelcomeAgent(uEmail, uName, ref[0]?.referralCode ?? "");
          } else {
            await sendWelcomeClient(uEmail, uName);
          }
          await notifyAdminNewUser({ name: uName, email: uEmail, role: _role, provider: "OAuth" });
        } catch(e:any) { console.error("[social notif]", e.message); }
      });
    }
    if (isNew) {
      const _role = (decoded.role === "agent" ? "agent" : "client") as string;
      setImmediate(async () => {
        try {
          const { getDb: _db2 } = await import("./queries/connection");
          const { referrals: _refs } = await import("../db/schema");
          const { eq: _eq2 } = await import("drizzle-orm");
          if (_role === "agent") {
            const ref = await _db2().select().from(_refs).where(_eq2(_refs.userId, userId)).limit(1);
            await sendWelcomeAgent(uEmail, uName, ref[0]?.referralCode ?? "");
          } else {
            await sendWelcomeClient(uEmail, uName);
          }
          await notifyAdminNewUser({ name: uName, email: uEmail, role: _role, provider: "OAuth" });
        } catch(e:any) { console.error("[social notif]", e.message); }
      });
    }
    if (isNew) {
      const _role = (decoded.role === "agent" ? "agent" : "client") as string;
      setImmediate(async () => {
        try {
          const { getDb: _db2 } = await import("./queries/connection");
          const { referrals: _refs } = await import("../db/schema");
          const { eq: _eq2 } = await import("drizzle-orm");
          if (_role === "agent") {
            const ref = await _db2().select().from(_refs).where(_eq2(_refs.userId, userId)).limit(1);
            await sendWelcomeAgent(uEmail, uName, ref[0]?.referralCode ?? "");
          } else {
            await sendWelcomeClient(uEmail, uName);
          }
          await notifyAdminNewUser({ name: uName, email: uEmail, role: _role, provider: "OAuth" });
        } catch(e:any) { console.error("[social notif]", e.message); }
      });
    }
    return c.redirect("/", 302);
  } catch (err) {
    console.error("[Google OAuth]", err);
    return c.redirect("/login?error=oauth_failed", 302);
  }
}

// ── Facebook ──────────────────────────────────────────────────────────────────

export function handleFacebookStart(c: Context) {
  const role = (c.req.query("role") as string) || "client";
  const origin = buildOrigin(c);
  const redirectUri = `${origin}/api/oauth/facebook/callback`;
  const oauthState = nanoid(16);
  const state = encodeState("facebook", role, oauthState);

  setCookie(c, "oauth_state", state, { httpOnly: true, path: "/", maxAge: 600 });

  const url = new URL("https://www.facebook.com/v18.0/dialog/oauth");
  url.searchParams.set("client_id", env.facebookClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "email,public_profile");
  url.searchParams.set("state", state);

  return c.redirect(url.toString(), 302);
}

export async function handleFacebookCallback(c: Context) {
  const code = c.req.query("code");
  const stateParam = c.req.query("state");
  const savedState = getCookie(c, "oauth_state");

  if (!code || !stateParam || stateParam !== savedState) {
    return c.redirect("/login?error=oauth_failed", 302);
  }

  const decoded = decodeState(stateParam);
  if (!decoded) return c.redirect("/login?error=oauth_failed", 302);

  const origin = buildOrigin(c);
  const redirectUri = `${origin}/api/oauth/facebook/callback`;

  try {
    const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", env.facebookClientId);
    tokenUrl.searchParams.set("client_secret", env.facebookClientSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    if (!tokenRes.ok) throw new Error("Facebook token exchange failed");
    const tokenData = await tokenRes.json() as { access_token: string };

    const profileUrl = new URL("https://graph.facebook.com/me");
    profileUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
    profileUrl.searchParams.set("access_token", tokenData.access_token);

    const profileRes = await fetch(profileUrl.toString());
    if (!profileRes.ok) throw new Error("Facebook profile fetch failed");
    const profile = await profileRes.json() as { id: string; name: string; email?: string; picture?: { data?: { url?: string } } };

    const role = (decoded.role === "agent" ? "agent" : "client") as "client" | "agent";
    const result = await upsertSocialUser({
      providerUserId: profile.id,
      provider: "facebook",
      name: profile.name,
      email: profile.email ?? null,
      avatar: profile.picture?.data?.url ?? null,
      role,
    });

    await issueSession(c, userId);
    return c.redirect("/", 302);
  } catch (err) {
    console.error("[Facebook OAuth]", err);
    return c.redirect("/login?error=oauth_failed", 302);
  }
}

// ── Twitter / X ───────────────────────────────────────────────────────────────

async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function handleTwitterStart(c: Context) {
  const role = (c.req.query("role") as string) || "client";
  const origin = buildOrigin(c);
  const redirectUri = `${origin}/api/oauth/twitter/callback`;
  const oauthState = nanoid(16);
  const state = encodeState("twitter", role, oauthState);

  const codeVerifier = await generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  setCookie(c, "oauth_state", state, { httpOnly: true, path: "/", maxAge: 600 });
  setCookie(c, "pkce_verifier", codeVerifier, { httpOnly: true, path: "/", maxAge: 600 });

  const url = new URL("https://twitter.com/i/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.twitterClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "tweet.read users.read offline.access");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  return c.redirect(url.toString(), 302);
}

export async function handleTwitterCallback(c: Context) {
  const code = c.req.query("code");
  const stateParam = c.req.query("state");
  const savedState = getCookie(c, "oauth_state");
  const codeVerifier = getCookie(c, "pkce_verifier");

  if (!code || !stateParam || stateParam !== savedState || !codeVerifier) {
    return c.redirect("/login?error=oauth_failed", 302);
  }

  const decoded = decodeState(stateParam);
  if (!decoded) return c.redirect("/login?error=oauth_failed", 302);

  const origin = buildOrigin(c);
  const redirectUri = `${origin}/api/oauth/twitter/callback`;

  try {
    const credentials = btoa(`${env.twitterClientId}:${env.twitterClientSecret}`);
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenRes.ok) throw new Error("Twitter token exchange failed");
    const tokenData = await tokenRes.json() as { access_token: string };

    const profileRes = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=name,profile_image_url",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
    );
    if (!profileRes.ok) throw new Error("Twitter profile fetch failed");
    const profileBody = await profileRes.json() as { data: { id: string; name: string; profile_image_url?: string } };
    const profile = profileBody.data;

    const role = (decoded.role === "agent" ? "agent" : "client") as "client" | "agent";
    const result = await upsertSocialUser({
      providerUserId: profile.id,
      provider: "twitter",
      name: profile.name,
      email: null,
      avatar: profile.profile_image_url ?? null,
      role,
    });

    await issueSession(c, userId);
    return c.redirect("/", 302);
  } catch (err) {
    console.error("[Twitter OAuth]", err);
    return c.redirect("/login?error=oauth_failed", 302);
  }
}
