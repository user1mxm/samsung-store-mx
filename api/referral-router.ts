// @ts-nocheck
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { referrals, commissions, users, orders, agents } from "../db/schema";
import { eq, and, desc, sql, ne } from "drizzle-orm";

function generateReferralCode(): string {
  return "SAM" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Tasas base por nivel (override-able por embajador)
const BASE_RATES = [8.0, 4.0, 2.0]; // nivel 1, 2, 3

export const referralRouter = createRouter({

  /* ─── Mi perfil de referido ─── */
  getMyReferral: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = Number(ctx.user.id);
    let ref = await db.select().from(referrals).where(eq(referrals.userId, userId)).limit(1);
    if (ref.length === 0) {
      const code = generateReferralCode();
      await db.insert(referrals).values({ userId, referralCode: code, level: 1 });
      ref = await db.select().from(referrals).where(eq(referrals.userId, userId)).limit(1);
    }
    return ref[0] ?? null;
  }),

  /* ─── Unirse con código ─── */
  joinWithCode: authedQuery
    .input(z.object({ code: z.string().min(3) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userId = Number(ctx.user.id);

      const existing = await db.select().from(referrals).where(eq(referrals.userId, userId)).limit(1);
      if (existing.length > 0 && existing[0].referrerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ya tienes un referido asignado" });
      }

      const referrer = await db.select().from(referrals)
        .where(eq(referrals.referralCode, input.code.toUpperCase())).limit(1);
      if (!referrer.length) throw new TRPCError({ code: "NOT_FOUND", message: "Código no válido" });

      const referrerId = referrer[0].userId;
      if (referrerId === userId) throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes referirte a ti mismo" });

      // Verificar límite de 40 sub-agentes del embajador
      const subCount = await db.select({ c: sql`COUNT(*)` }).from(referrals)
        .where(eq(referrals.referrerId, referrerId));
      const limit = Number(referrer[0].subAgentLimit ?? 40);
      if (Number((subCount[0] as any).c) >= limit) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Este embajador ya alcanzó su límite de ${limit} sub-agentes` });
      }

      const level = Math.min(referrer[0].level + 1, 4);
      if (existing.length === 0) {
        const code = generateReferralCode();
        await db.insert(referrals).values({ userId, referrerId, referralCode: code, level });
      } else {
        await db.update(referrals).set({ referrerId, level }).where(eq(referrals.userId, userId));
      }
      await db.update(referrals)
        .set({ networkSize: sql`${referrals.networkSize} + 1` })
        .where(eq(referrals.userId, referrerId));

      return { success: true };
    }),

  /* ─── Mi red completa ─── */
  getMyNetwork: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = Number(ctx.user.id);

    const myRef = await db.select().from(referrals).where(eq(referrals.userId, userId)).limit(1);
    if (!myRef.length) return { myCode: null, directCount: 0, network: [], totalEarnings: "0", totalNetworkSales: "0", networkSize: 0 };

    // Sub-agentes directos con sus comisiones personalizadas
    const direct = await db.select({
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
    .orderBy(desc(referrals.totalEarnings));

    // Tasas personalizadas de ambassador_commissions si existe la tabla
    let rateMap: Record<number, number> = {};
    try {
      const rates = await db.execute(sql`
        SELECT subAgentId, rate FROM ambassador_commissions WHERE ambassadorId = ${userId}
      `);
      for (const r of (rates[0] as any[])) {
        rateMap[Number(r.subAgentId)] = Number(r.rate);
      }
    } catch {}

    const network = direct.map(d => ({
      ...d,
      customRate: rateMap[d.userId] ?? null,
    }));

    return {
      myCode: myRef[0].referralCode,
      directCount: direct.length,
      totalEarnings: myRef[0].totalEarnings,
      totalNetworkSales: myRef[0].totalNetworkSales,
      networkSize: myRef[0].networkSize,
      subAgentLimit: myRef[0].subAgentLimit ?? 40,
      network,
    };
  }),

  /* ─── Mis comisiones ─── */
  getMyCommissions: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = Number(ctx.user.id);
    const comms = await db.select().from(commissions)
      .where(eq(commissions.userId, userId))
      .orderBy(desc(commissions.createdAt)).limit(100);
    const totalPending = comms.filter(c=>c.status==="pending").reduce((s,c)=>s+Number(c.amount),0);
    const totalPaid    = comms.filter(c=>c.status==="paid").reduce((s,c)=>s+Number(c.amount),0);
    return { commissions: comms, totalPending, totalPaid };
  }),

  /* ─── EMBAJADOR: Modificar comisión de un sub-agente ─── */
  setSubAgentRate: authedQuery
    .input(z.object({
      subAgentUserId: z.number(),
      rate: z.number().min(0).max(25), // máximo 25%
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const ambassadorId = Number(ctx.user.id);

      // Verificar que el sub-agente pertenece a este embajador
      const sub = await db.select().from(referrals)
        .where(and(eq(referrals.userId, input.subAgentUserId), eq(referrals.referrerId, ambassadorId)))
        .limit(1);
      if (!sub.length) throw new TRPCError({ code: "FORBIDDEN", message: "Este usuario no es tu sub-agente" });

      // Upsert en ambassador_commissions
      try {
        await db.execute(sql`
          INSERT INTO ambassador_commissions (ambassadorId, subAgentId, rate, notes)
          VALUES (${ambassadorId}, ${input.subAgentUserId}, ${input.rate}, ${input.notes ?? null})
          ON DUPLICATE KEY UPDATE rate = ${input.rate}, notes = ${input.notes ?? null}
        `);
      } catch (e: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error guardando tasa: " + e.message });
      }

      return { success: true };
    }),

  /* ─── EMBAJADOR: Estadísticas de su red ─── */
  getNetworkStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = Number(ctx.user.id);

    const myRef = await db.select().from(referrals).where(eq(referrals.userId, userId)).limit(1);
    if (!myRef.length) return { totalEarnings: 0, totalNetworkSales: 0, networkSize: 0, subAgents: [] };

    // Sub-agentes con sus ventas individuales
    const subs = await db.select({
      userId: referrals.userId,
      totalEarnings: referrals.totalEarnings,
      totalNetworkSales: referrals.totalNetworkSales,
      networkSize: referrals.networkSize,
      name: users.name,
      email: users.email,
    })
    .from(referrals)
    .innerJoin(users, eq(referrals.userId, users.id))
    .where(eq(referrals.referrerId, userId));

    // Tasas personalizadas
    let rateMap: Record<number, number> = {};
    try {
      const rates = await db.execute(sql`
        SELECT subAgentId, rate FROM ambassador_commissions WHERE ambassadorId = ${userId}
      `);
      for (const r of (rates[0] as any[])) rateMap[Number(r.subAgentId)] = Number(r.rate);
    } catch {}

    return {
      totalEarnings: Number(myRef[0].totalEarnings),
      totalNetworkSales: Number(myRef[0].totalNetworkSales),
      networkSize: myRef[0].networkSize,
      subAgentLimit: myRef[0].subAgentLimit ?? 40,
      subAgents: subs.map(s => ({
        ...s,
        customRate: rateMap[s.userId] ?? BASE_RATES[0],
        totalEarnings: Number(s.totalEarnings),
        totalNetworkSales: Number(s.totalNetworkSales),
      })),
    };
  }),

  /* ─── ADMIN: árbol de red completo ─── */
  getNetworkTree: adminQuery.query(async () => {
    const db = getDb();
    const all = await db.select({
      userId: referrals.userId,
      referrerId: referrals.referrerId,
      referralCode: referrals.referralCode,
      level: referrals.level,
      totalEarnings: referrals.totalEarnings,
      networkSize: referrals.networkSize,
      name: users.name,
    })
    .from(referrals)
    .innerJoin(users, eq(referrals.userId, users.id));
    return all;
  }),

  /* ─── Generar comisiones (llamado al crear orden) ─── */
  generateCommissions: authedQuery
    .input(z.object({ orderId: z.number(), buyerId: z.number(), total: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      let currentUserId = input.buyerId;
      const created = [];
      for (let i = 0; i < 3; i++) {
        const ref = await db.select().from(referrals).where(eq(referrals.userId, currentUserId)).limit(1);
        if (!ref.length || !ref[0].referrerId) break;
        const referrerId = ref[0].referrerId;

        // Buscar tasa personalizada
        let pct = BASE_RATES[i];
        try {
          const custom = await db.execute(sql`
            SELECT rate FROM ambassador_commissions WHERE ambassadorId=${referrerId} AND subAgentId=${currentUserId} LIMIT 1
          `);
          const rows = custom[0] as any[];
          if (rows.length) pct = Number(rows[0].rate);
        } catch {}

        const amount = (input.total * pct) / 100;
        await db.insert(commissions).values({
          userId: referrerId, fromUserId: input.buyerId, orderId: input.orderId,
          amount: amount.toFixed(2), level: i+1, percentage: pct.toFixed(2),
        });
        await db.update(referrals).set({
          totalEarnings: sql`${referrals.totalEarnings} + ${amount.toFixed(2)}`,
          totalNetworkSales: sql`${referrals.totalNetworkSales} + ${input.total.toFixed(2)}`,
        }).where(eq(referrals.userId, referrerId));

        created.push({ userId: referrerId, amount, level: i+1, pct });
        currentUserId = referrerId;
      }
      return { success: true, created };
    }),
});
