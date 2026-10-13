// @ts-nocheck
import { z } from "zod";
import { createRouter, authedQuery, adminQuery, publicQuery } from "./middleware";
import { getDb, getOrderPool } from "./queries/connection";
import { TRPCError } from "@trpc/server";
import { transaction,awardRewards,audit } from './commerce/core.mjs';
import { transitionOrder, OrderError } from "./orders-service.mjs";
import { paymentConfig } from "./payments/config";
import { startCheckout, checkoutStatus } from "./payments/checkout-service.mjs";
import { orders, orderItems } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const orderRouter = createRouter({
  paymentProviders: publicQuery.query(async () => {
    const providers = ['stripe', 'mercadopago'].filter(provider => paymentConfig(provider));
    if (!providers.length) return [];
    try {
      await getOrderPool().query('SELECT inventoryReserved FROM orders LIMIT 0');
      await getOrderPool().query('SELECT id FROM paymentAttempts LIMIT 0');
      await getOrderPool().query('SELECT eventId FROM paymentEvents LIMIT 0');
      return providers;
    } catch { return []; }
  }),

  checkout: authedQuery.input(z.object({
    provider: z.enum(['stripe', 'mercadopago']),
    requestKey: z.uuid(),
    items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(999) })).min(1).max(50),
    quoteToken: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    service: z.object({zoneId:z.number().int().positive(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),installation:z.boolean()}).optional(),
    shippingAddress: z.object({
      name: z.string().trim().min(2).max(150), email: z.email().max(320), phone: z.string().regex(/^\+?[\d ()-]{10,20}$/),
      address: z.string().trim().min(5).max(300), city: z.string().trim().min(2).max(100), postalCode: z.string().regex(/^\d{5}$/),
    }),
  })).mutation(async ({ ctx, input }) => {
    const config = paymentConfig(input.provider);
    if (!config) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Payments unavailable' });
    if(!input.service) throw new TRPCError({code:'PRECONDITION_FAILED',message:'Selecciona entrega por código postal'});
    try { return await startCheckout(getOrderPool(), ctx.user.id, input, config); }
    catch (error) {
      if (error instanceof OrderError) throw new TRPCError({ code: error.code, message: error.message });
      throw error;
    }
  }),

  checkoutStatus: authedQuery.input(z.object({ reference: z.uuid().optional() })).query(async ({ ctx, input }) => {
    try { return await checkoutStatus(getOrderPool(), ctx.user.id, input.reference); }
    catch (error) {
      if (error instanceof OrderError) throw new TRPCError({ code: error.code, message: error.message });
      throw error;
    }
  }),

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
        total: z.number().or(z.string()).optional(),
        items: z.array(
          z.object({
            productId: z.number().int().positive(),
            quantity: z.number().int().min(1).max(999),
            price: z.number().or(z.string()).optional(),
          })
        ).min(1).max(50),
        shippingAddress: z.record(z.string(), z.string().max(500)).optional(),
      })
    )
    .mutation(async () => {
      throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Usa el checkout actualizado para crear un pedido' });
    }),

  updateStatus: adminQuery
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]) }))
    .mutation(async ({ input,ctx }) => {
      try {
        const result=await transitionOrder(getOrderPool(), input.id, input.status);
        await transaction(getOrderPool(),async c=>{await awardRewards(c,input.id);await audit(c,ctx.user.id,'order.status',input.id,{status:input.status});});
        return result;
      } catch (error) {
        if (error instanceof OrderError) throw new TRPCError({ code: error.code, message: error.message });
        throw error;
      }
    }),
});
