import { getOrderPool } from './queries/connection';
import { audit } from './commerce/core.mjs';
import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

function requireRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

export const authedQuery = t.procedure.use(requireAuth);
const recordAdminMutation = t.middleware(async ({ctx,type,path,next}) => {
  if(type !== 'mutation') return next();
  // Log intent before invoking a legacy mutation: failure to record stops the write.
  await audit(getOrderPool(),ctx.user!.id,`${path}.requested`,'');
  const result=await next();
  await audit(getOrderPool(),ctx.user!.id,`${path}.${result.ok?'completed':'failed'}`,'');
  return result;
});
export const adminQuery = authedQuery.use(requireRole("admin")).use(recordAdminMutation);
export const agentQuery = authedQuery.use(requireRole("agent"));
