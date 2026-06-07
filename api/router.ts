import { authRouter } from "./auth-router";
import { localAuthRouter } from "./local-auth-router";
import { productRouter } from "./product-router";
import { orderRouter } from "./order-router";
import { agentRouter } from "./agent-router";
import { reviewRouter } from "./review-router";
import { referralRouter } from "./referral-router";
import { cartRouter } from "./cart-router";
import { withdrawalRouter } from "./withdrawal-router";
import { userRouter } from "./user-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  localAuth: localAuthRouter,
  product: productRouter,
  order: orderRouter,
  agent: agentRouter,
  review: reviewRouter,
  referral: referralRouter,
  cart: cartRouter,
  withdrawal: withdrawalRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
