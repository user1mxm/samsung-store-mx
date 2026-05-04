// @ts-nocheck
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { withdrawals, commissions, referrals } from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const withdrawalRouter = createRouter({
  request: authedQuery
    .input(
      z.object({
        amount: z.number().positive(),
        method: z.enum(["spei", "oxxo", "paypal"]),
        accountInfo: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Check available balance from paid + pending commissions
      const comms = await db.select().from(commissions).where(eq(commissions.userId, userId));
      const totalPending = comms.filter(c => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0);

      if (input.amount > totalPending) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Saldo insuficiente. Solo puedes retirar comisiones pendientes." });
      }

      await db.insert(withdrawals).values({
        userId,
        amount: input.amount.toFixed(2),
        method: input.method,
        accountInfo: input.accountInfo,
        status: "pending",
      });

      return { success: true };
    }),

  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db.select().from(withdrawals)
      .where(eq(withdrawals.userId, ctx.user.id))
      .orderBy(desc(withdrawals.createdAt));
    return rows;
  }),

  listAll: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));
  }),

  approve: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(withdrawals).where(eq(withdrawals.id, input.id)).limit(1);
      const withdrawal = rows[0];
      if (!withdrawal) throw new TRPCError({ code: "NOT_FOUND", message: "Retiro no encontrado" });

      await db.update(withdrawals)
        .set({ status: "completed", processedAt: new Date() })
        .where(eq(withdrawals.id, input.id));

      // Mark corresponding pending commissions as paid (up to withdrawal amount)
      const comms = await db.select().from(commissions)
        .where(and(eq(commissions.userId, withdrawal.userId), eq(commissions.status, "pending")))
        .orderBy(desc(commissions.createdAt));

      let remaining = Number(withdrawal.amount);
      for (const c of comms) {
        if (remaining <= 0) break;
        const amt = Number(c.amount);
        if (amt <= remaining) {
          await db.update(commissions).set({ status: "paid" }).where(eq(commissions.id, c.id));
          remaining -= amt;
        }
      }

      return { success: true };
    }),

  reject: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(withdrawals)
        .set({ status: "rejected", processedAt: new Date() })
        .where(eq(withdrawals.id, input.id));
      return { success: true };
    }),
});
