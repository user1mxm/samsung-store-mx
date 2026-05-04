// @ts-nocheck
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { cartItems, products } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const cartRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;
    const rows = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
    const enriched = [];
    for (const item of rows) {
      const prod = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (prod[0]) enriched.push({ ...item, product: prod[0] });
    }
    return enriched;
  }),

  add: authedQuery
    .input(z.object({ productId: z.number(), quantity: z.number().min(1).default(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const existing = await db.select().from(cartItems)
        .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, input.productId)))
        .limit(1);
      if (existing.length > 0) {
        await db.update(cartItems)
          .set({ quantity: existing[0].quantity + input.quantity })
          .where(eq(cartItems.id, existing[0].id));
      } else {
        await db.insert(cartItems).values({ userId, productId: input.productId, quantity: input.quantity });
      }
      return { success: true };
    }),

  updateQty: authedQuery
    .input(z.object({ productId: z.number(), quantity: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      if (input.quantity === 0) {
        await db.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, input.productId)));
      } else {
        await db.update(cartItems).set({ quantity: input.quantity })
          .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, input.productId)));
      }
      return { success: true };
    }),

  remove: authedQuery
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(cartItems).where(and(eq(cartItems.userId, ctx.user.id), eq(cartItems.productId, input.productId)));
      return { success: true };
    }),

  clear: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db.delete(cartItems).where(eq(cartItems.userId, ctx.user.id));
    return { success: true };
  }),
});
