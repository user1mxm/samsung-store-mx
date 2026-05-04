import { z } from "zod";
import { createRouter, publicQuery, adminQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { agents, users, orders } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const AGENT_TIERS = [
  { name: "Bronce", min: 0, rate: 0.03, color: "from-amber-600 to-amber-700" },
  { name: "Plata", min: 20000, rate: 0.05, color: "from-gray-400 to-gray-500" },
  { name: "Oro", min: 50000, rate: 0.07, color: "from-yellow-400 to-yellow-500" },
  { name: "Platino", min: 100000, rate: 0.10, color: "from-cyan-400 to-cyan-500" },
  { name: "Diamante", min: 250000, rate: 0.15, color: "from-blue-500 to-purple-500" },
] as const;

export function getAgentTier(totalSales: number) {
  return [...AGENT_TIERS].reverse().find((t) => totalSales >= t.min) ?? AGENT_TIERS[0];
}

export const agentRouter = createRouter({
  // Get current agent's stats (for agent portal)
  getMyStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db.select().from(agents).where(eq(agents.userId, ctx.user.id)).limit(1);
    const agent = rows[0];
    if (!agent) return null;
    const totalSalesNum = Number(agent.totalSales ?? 0);
    const tier = getAgentTier(totalSalesNum);
    const nextTier = AGENT_TIERS.find((t) => t.min > totalSalesNum) ?? null;
    const orderRows = await db.select().from(orders).where(eq(orders.agentId, agent.id));
    return {
      ...agent,
      tier,
      nextTier,
      commissionRate: tier.rate,
      orderCount: orderRows.length,
    };
  }),

  list: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(agents).orderBy(desc(agents.createdAt));
    // join users to get name and add tier info
    const enriched = [];
    for (const agent of rows) {
      const userRows = await db.select().from(users).where(eq(users.id, agent.userId)).limit(1);
      const totalSalesNum = Number(agent.totalSales ?? 0);
      const tier = getAgentTier(totalSalesNum);
      enriched.push({ ...agent, name: userRows[0]?.name ?? "Agent", tier, commissionRate: tier.rate });
    }
    return enriched;
  }),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(agents).where(eq(agents.id, input.id)).limit(1);
      return rows[0] ?? null;
    }),

  create: adminQuery
    .input(
      z.object({
        userId: z.number(),
        code: z.string().min(3),
        specialty: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(agents).values(input);
      return { success: true };
    }),

  updateStatus: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["online", "busy", "offline"]) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(agents).set({ status: input.status }).where(eq(agents.id, input.id));
      return { success: true };
    }),

  updateCommission: adminQuery
    .input(z.object({ id: z.number(), commission: z.number().or(z.string()), totalSales: z.number().or(z.string()).optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data: any = { commission: String(input.commission) };
      if (input.totalSales !== undefined) data.totalSales = String(input.totalSales);
      await db.update(agents).set(data).where(eq(agents.id, input.id));
      return { success: true };
    }),
});
