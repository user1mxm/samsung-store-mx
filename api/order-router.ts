// @ts-nocheck
import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, orderItems } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const orderRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    if (ctx.user.role === "admin") {
      return db.select().from(orders).orderBy(desc(orders.createdAt));
    }
    return db.select().from(orders).where(eq(orders.userId, ctx.user.id)).orderBy(desc(orders.createdAt));
  }),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db.select().from(orders).where(eq(orders.id, input.id)).limit(1);
      const order = rows[0];
      if (!order) return null;
      if (ctx.user.role !== "admin" && order.userId !== ctx.user.id) {
        throw new Error("Not authorized");
      }
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    }),

  create: authedQuery
    .input(
      z.object({
        total: z.number().or(z.string()),
        agentId: z.number().optional(),
        items: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number(),
            price: z.number().or(z.string()),
          })
        ),
        shippingAddress: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // @ts-ignore
      const orderResult = await db.insert(orders).values([{
        userId: ctx.user.id,
        agentId: input.agentId ?? null,
        total: String(input.total),
        shippingAddress: input.shippingAddress ? JSON.stringify(input.shippingAddress) : null,
      }]);
      const orderId = Number((orderResult as any)[0].insertId);

      for (const item of input.items) {
        await db.insert(orderItems).values({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: String(item.price),
        });
      }

      return { success: true, orderId };
    }),

  updateStatus: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.id));
      return { success: true };
    }),
});
