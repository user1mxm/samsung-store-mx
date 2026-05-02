import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { signSessionToken, verifySessionToken } from "./kimi/session";
import { env } from "./lib/env";
import { getSessionCookieOptions } from "./lib/cookies";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + env.appSecret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const localAuthRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["client", "agent"]).default("client"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Block any attempt to register as admin or with admin email
      if (input.email.toLowerCase() === "admin@samsung.mx") {
        throw new Error("Unauthorized: admin account is restricted");
      }

      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new Error("Email already registered");
      }

      const hashed = await hashPassword(input.password);
      const [result] = await db.insert(users).values({
        name: input.name,
        email: input.email,
        password: hashed,
        role: input.role,
      });

      const userId = Number(result.insertId);
      const token = await signSessionToken({
        unionId: `local-${userId}`,
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

      return { success: true, userId };
    }),

  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const rows = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      const user = rows[0];
      if (!user || !user.password) {
        throw new Error("Invalid credentials");
      }

      const hashed = await hashPassword(input.password);
      if (hashed !== user.password) {
        throw new Error("Invalid credentials");
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

      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } };
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
