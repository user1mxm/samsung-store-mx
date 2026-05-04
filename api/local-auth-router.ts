// @ts-nocheck
import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { signSessionToken, verifySessionToken } from "./kimi/session";
import { env } from "./lib/env";
import { getSessionCookieOptions } from "./lib/cookies";
import { sendTempPasswordEmail, sendPasswordResetEmail } from "./lib/email";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { nanoid } from "nanoid";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + env.appSecret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  for (const byte of array) {
    result += chars[byte % chars.length];
  }
  return result;
}

export const localAuthRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        role: z.enum(["client", "agent"]).default("client"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Block any attempt to register as admin or with admin email
      if (input.email.toLowerCase() === "admin@samsung.mx") {
        throw new Error("Unauthorized: admin account is restricted");
      }

      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new Error("Email ya registrado");
      }

      const tempPassword = generateTempPassword();
      const hashed = await hashPassword(tempPassword);

      const [result] = await db.insert(users).values({
        name: input.name,
        email: input.email,
        password: hashed,
        role: input.role,
        provider: "local",
        emailVerified: false,
        mustChangePassword: true,
      });

      const userId = Number(result.insertId);

      // Send temp password email (best-effort)
      try {
        await sendTempPasswordEmail(input.email, input.name, tempPassword);
      } catch (emailErr) {
        console.error("[register] Failed to send temp password email:", emailErr);
      }

      return { success: true, userId };
    }),

  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
        isAdmin: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const rows = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      const user = rows[0];
      if (!user || !user.password) {
        throw new Error("Credenciales incorrectas");
      }

      // Admin accounts can only log in from the admin route
      if (user.role === "admin" && !input.isAdmin) {
        throw new Error("Las cuentas de administrador deben acceder por /login/admin");
      }

      const hashed = await hashPassword(input.password);
      if (hashed !== user.password) {
        throw new Error("Credenciales incorrectas");
      }

      await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, user.id));

      const token = await signSessionToken({
        unionId: user.unionId ?? `local-${user.id}`,
        clientId: env.appId,
      });

      const cookieOpts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: cookieOpts.httpOnly,
          path: cookieOpts.path,
          sameSite: cookieOpts.sameSite?.toLowerCase() as "lax" | "none",
          secure: cookieOpts.secure,
          maxAge: Session.maxAgeMs / 1000,
        })
      );

      return {
        success: true,
        mustChangePassword: user.mustChangePassword,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      };
    }),

  changePassword: authedQuery
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const rows = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const user = rows[0];
      if (!user || !user.password) {
        throw new Error("Usuario no encontrado");
      }

      const hashed = await hashPassword(input.currentPassword);
      if (hashed !== user.password) {
        throw new Error("Contraseña actual incorrecta");
      }

      const newHashed = await hashPassword(input.newPassword);
      await db.update(users).set({ password: newHashed, mustChangePassword: false }).where(eq(users.id, user.id));

      return { success: true };
    }),

  resetPasswordByToken: publicQuery
    .input(
      z.object({
        token: z.string().min(1),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(users).where(eq(users.passwordResetToken, input.token)).limit(1);
      const user = rows[0];
      if (!user || !user.passwordResetExpiry) {
        throw new Error("Token inválido o expirado");
      }
      if (new Date() > user.passwordResetExpiry) {
        throw new Error("El enlace de restablecimiento ha expirado");
      }

      const newHashed = await hashPassword(input.newPassword);
      await db.update(users).set({
        password: newHashed,
        mustChangePassword: false,
        passwordResetToken: null,
        passwordResetExpiry: null,
      }).where(eq(users.id, user.id));

      return { success: true };
    }),

  forgotPassword: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const rows = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      const user = rows[0];

      // Always return success to avoid email enumeration
      if (!user) return { success: true };

      const resetToken = nanoid(32);
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.update(users).set({ passwordResetToken: resetToken, passwordResetExpiry: expiry }).where(eq(users.id, user.id));

      const host = ctx.req.headers.get("host") ?? "samsungstore.com.mx";
      const proto = ctx.req.headers.get("x-forwarded-proto") ?? "https";
      const baseUrl = `${proto}://${host}`;

      try {
        await sendPasswordResetEmail(user.email!, user.name, resetToken, baseUrl);
      } catch (emailErr) {
        console.error("[forgotPassword] Failed to send reset email:", emailErr);
      }

      return { success: true };
    }),

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
