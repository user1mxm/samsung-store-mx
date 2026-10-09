// @ts-nocheck
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { TRPCError } from "@trpc/server";
import { changeCart } from "./cart-service.mjs";
import { getOrderPool } from "./queries/connection";
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

  add: authedQuery.input(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(999).default(1) }))
    .mutation(async ({ ctx, input }) => {
      try { return await changeCart(getOrderPool(), ctx.user.id, input.productId, input.quantity, 'add'); }
      catch (error) { throw new TRPCError({ code: error.code === 'NOT_FOUND' ? 'NOT_FOUND' : 'BAD_REQUEST', message: error.message }); }
    }),
  updateQty: authedQuery.input(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(0).max(999) }))
    .mutation(async ({ ctx, input }) => {
      try { return await changeCart(getOrderPool(), ctx.user.id, input.productId, input.quantity); }
      catch (error) { throw new TRPCError({ code: error.code === 'NOT_FOUND' ? 'NOT_FOUND' : 'BAD_REQUEST', message: error.message }); }
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
