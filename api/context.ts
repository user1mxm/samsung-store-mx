import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { localAuthRouter } from "./local-auth-router";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: Pick<User, 'id' | 'name' | 'email' | 'avatar' | 'role' | 'provider' | 'emailVerified' | 'mustChangePassword' | 'createdAt' | 'lastSignInAt'>;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  if (!opts.req.headers.get('cookie')) return ctx;
  try {
    const me = await localAuthRouter.createCaller(ctx).me();
    if (me) ctx.user = me;
  } catch { /* Invalid local identity falls back to the configured provider. */ }
  if (!ctx.user) {
    try { ctx.user = await authenticateRequest(opts.req.headers); }
    catch { /* Anonymous request. */ }
  }
  return ctx;
}
