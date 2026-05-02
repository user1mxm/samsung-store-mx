// @ts-nocheck
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { referrals, commissions, users, orders } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

function generateReferralCode(): string {
  return "SAM" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Commission percentages by level
const COMMISSION_RATES = [0.08, 0.04, 0.02]; // 8%, 4%, 2%

export const referralRouter = createRouter({
  // Get or create referral profile
  getMyReferral: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = Number(ctx.session.user.id);

    let ref = await db.select().from(referrals).where(eq(referrals.userId, userId)).limit(1);

    if (ref.length === 0) {
      // Create referral profile
      const code = generateReferralCode();
      await db.insert(referrals).values({ userId, referralCode: code, level: 1 });
      ref = await db.select().from(referrals).where(eq(referrals.userId, userId)).limit(1);
    }

    return ref[0] || null;
  }),

  // Join with referral code
  joinWithCode: authedQuery
    .input(z.object({ code: z.string().min(3) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userId = Number(ctx.session.user.id);

      // Check if user already has a referrer
      const existing = await db.select().from(referrals).where(eq(referrals.userId, userId)).limit(1);
      if (existing.length > 0 && existing[0].referrerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ya tienes un referido asignado" });
      }

      // Find referrer by code
      const referrer = await db.select().from(referrals).where(eq(referrals.referralCode, input.code.toUpperCase())).limit(1);
      if (referrer.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Codigo de referido no valido" });
      }

      const referrerId = referrer[0].userId;
      if (referrerId === userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes referirte a ti mismo" });
      }

      // Calculate level (depth in tree)
      const level = Math.min(referrer[0].level + 1, 4);

      // Create or update referral record
      if (existing.length === 0) {
        const code = generateReferralCode();
        await db.insert(referrals).values({ userId, referrerId, referralCode: code, level });
      } else {
        await db.update(referrals).set({ referrerId, level }).where(eq(referrals.userId, userId));
      }

      // Update referrer network size
      await db.update(referrals)
        .set({ networkSize: sql`${referrals.networkSize} + 1` })
        .where(eq(referrals.userId, referrerId));

      return { success: true, referrerName: referrer[0].referralCode };
    }),

  // Get my network (direct referrals)
  getMyNetwork: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = Number(ctx.session.user.id);

    const myReferral = await db.select().from(referrals).where(eq(referrals.userId, userId)).limit(1);
    if (myReferral.length === 0) return { myCode: null, directCount: 0, network: [] };

    const code = myReferral[0].referralCode;

    // Get direct referrals
    const direct = await db
      .select({
        id: referrals.id,
        userId: referrals.userId,
        level: referrals.level,
        totalEarnings: referrals.totalEarnings,
        totalNetworkSales: referrals.totalNetworkSales,
        networkSize: referrals.networkSize,
        createdAt: referrals.createdAt,
        name: users.name,
        email: users.email,
      })
      .from(referrals)
      .innerJoin(users, eq(referrals.userId, users.id))
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt));

    return {
      myCode: code,
      directCount: direct.length,
      totalEarnings: myReferral[0].totalEarnings,
      totalNetworkSales: myReferral[0].totalNetworkSales,
      networkSize: myReferral[0].networkSize,
      network: direct,
    };
  }),

  // Get my commissions
  getMyCommissions: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = Number(ctx.session.user.id);

    const comms = await db
      .select()
      .from(commissions)
      .where(eq(commissions.userId, userId))
      .orderBy(desc(commissions.createdAt))
      .limit(50);

    const totalPending = comms
      .filter(c => c.status === "pending")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const totalPaid = comms
      .filter(c => c.status === "paid")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    return { commissions: comms, totalPending, totalPaid };
  }),

  // Generate commissions from an order (called after order creation)
  generateCommissions: authedQuery
    .input(z.object({ orderId: z.number(), buyerId: z.number(), total: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // Walk up the referral tree (max 3 levels)
      let currentUserId = input.buyerId;
      const commissionsCreated = [];

      for (let i = 0; i < 3; i++) {
        const ref = await db.select().from(referrals).where(eq(referrals.userId, currentUserId)).limit(1);
        if (ref.length === 0 || !ref[0].referrerId) break;

        const referrerId = ref[0].referrerId;
        const percentage = COMMISSION_RATES[i];
        const amount = input.total * percentage;

        // Insert commission
        await db.insert(commissions).values({
          userId: referrerId,
          fromUserId: input.buyerId,
          orderId: input.orderId,
          amount: amount.toFixed(2),
          level: i + 1,
          percentage: (percentage * 100).toFixed(2),
        });

        // Update referrer earnings
        await db.update(referrals)
          .set({
            totalEarnings: sql`${referrals.totalEarnings} + ${amount.toFixed(2)}`,
            totalNetworkSales: sql`${referrals.totalNetworkSales} + ${input.total.toFixed(2)}`,
          })
          .where(eq(referrals.userId, referrerId));

        commissionsCreated.push({ userId: referrerId, amount, level: i + 1 });
        currentUserId = referrerId;
      }

      return { success: true, commissionsCreated };
    }),
});
