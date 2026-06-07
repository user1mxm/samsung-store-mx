import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { localAuthRouter } from "./local-auth-router";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    // Try Kimi OAuth first
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // Fallback to local auth
    try {
      const me = await localAuthRouter.createCaller(ctx).me();
      if (me) ctx.user = me;
    } catch {
      // No auth
    }
  }
  return ctx;
}
