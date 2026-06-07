// @ts-nocheck
import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, referrals, agents } from "@db/schema";
import { eq } from "drizzle-orm";
import { signSessionToken, verifySessionToken } from "./kimi/session";
import { env } from "./lib/env";
import { getSessionCookieOptions } from "./lib/cookies";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { sendWelcomeClient, sendWelcomeAgent, notifyAdminNewUser } from "./lib/mailer";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + env.appSecret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateReferralCode(): string {
  return "SAM" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function issueSession(ctx: any, userId: number) {
  const token = await signSessionToken({ unionId: `local-${userId}`, clientId: env.appId });
  const cookieOpts = getSessionCookieOptions(ctx.req.headers);
  ctx.resHeaders.append("set-cookie", cookie.serialize(Session.cookieName, token, {
    httpOnly: cookieOpts.httpOnly,
    path: cookieOpts.path,
    sameSite: cookieOpts.sameSite?.toLowerCase() as "lax" | "none",
    secure: cookieOpts.secure,
    maxAge: Session.maxAgeMs / 1000,
  }));
}

async function createReferralProfile(userId: number): Promise<string> {
  const db = getDb();
  const code = generateReferralCode();
  try {
    await db.insert(referrals).values({ userId, referralCode: code, level: 1 });
  } catch {}
  return code;
}

export const localAuthRouter = createRouter({

  /* ─── Registro ─── */
  register: publicQuery
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      phone: z.string().optional(),
      role: z.enum(["client", "agent"]).default("client"),
      referralCode: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      if (input.email.toLowerCase().includes("admin@samsung")) {
        throw new Error("Email restringido");
      }

      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) throw new Error("Este correo ya está registrado");

      const hashed = await hashPassword(input.password);
      const [result] = await db.insert(users).values({
        name: input.name,
        email: input.email,
        password: hashed,
        role: input.role,
      });

      const userId = Number(result.insertId);

      // Crear perfil de referido
      const code = await createReferralProfile(userId);

      // Si viene con código de referido, vincular
      if (input.referralCode) {
        try {
          const referrer = await db.select().from(referrals)
            .where(eq(referrals.referralCode, input.referralCode.toUpperCase())).limit(1);
          if (referrer.length > 0 && referrer[0].userId !== userId) {
            await db.update(referrals).set({
              referrerId: referrer[0].userId,
              level: Math.min(referrer[0].level + 1, 4),
            }).where(eq(referrals.userId, userId));
          }
        } catch {}
      }

      // Si es agente, crear registro en agents
      if (input.role === "agent") {
        try {
          await db.insert(agents).values({
            userId,
            code: `AGENT-${String(userId).padStart(3, "0")}`,
            specialty: "General",
            phone: input.phone,
            status: "online",
          });
        } catch {}
      }

      // Emitir sesión
      await issueSession(ctx, userId);

      // Notificaciones en background (no bloquean la respuesta)
      const role = input.role;
      const name = input.name;
      const email = input.email;
      setImmediate(async () => {
        try {
          if (role === "agent") {
            await sendWelcomeAgent(email, name, code);
          } else {
            await sendWelcomeClient(email, name);
          }
          await notifyAdminNewUser({ name, email, role, provider: "email/password" });
        } catch (e: any) {
          console.error("[register notif]", e.message);
        }
      });

      return { success: true, userId, role };
    }),

  /* ─── Login ─── */
  login: publicQuery
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const rows = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      const user = rows[0];
      if (!user || !user.password) throw new Error("Credenciales inválidas");

      const hashed = await hashPassword(input.password);
      if (hashed !== user.password) throw new Error("Credenciales inválidas");

      await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, user.id));
      await issueSession(ctx, user.id);

      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } };
    }),

  /* ─── Me ─── */
  me: publicQuery.query(async ({ ctx }) => {
    const cookies = cookie.parse(ctx.req.headers.get("cookie") || "");
    const token = cookies[Session.cookieName];
    if (!token) return null;
    const claim = await verifySessionToken(token);
    if (!claim) return null;
    const db = getDb();
    let user;
    if (claim.unionId.startsWith("local-")) {
      const userId = parseInt(claim.unionId.replace("local-", ""));
      const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      user = rows[0];
    } else {
      const rows = await db.select().from(users).where(eq(users.unionId, claim.unionId)).limit(1);
      user = rows[0];
    }
    return user ?? null;
  }),
});
