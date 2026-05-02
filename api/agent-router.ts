import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { agents, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const agentRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(agents).orderBy(desc(agents.createdAt));
    // join users to get name
    const enriched = [];
    for (const agent of rows) {
      const userRows = await db.select().from(users).where(eq(users.id, agent.userId)).limit(1);
      enriched.push({ ...agent, name: userRows[0]?.name ?? "Agent" });
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
