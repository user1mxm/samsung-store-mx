// @ts-nocheck
import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, agents, orders } from "@db/schema";
import { eq, desc, inArray } from "drizzle-orm";

export const usersRouter = createRouter({
  /** Full user list with light per-user aggregates, for the admin "Usuarios" tab. */
  list: adminQuery.query(async () => {
    const db = getDb();
    const all = await db.select().from(users).orderBy(desc(users.createdAt));

    const allOrders = await db.select().from(orders);
    const ordersByUser: Record<number, { count: number; total: number }> = {};
    for (const o of allOrders) {
      const u = Number(o.userId);
      ordersByUser[u] ??= { count: 0, total: 0 };
      ordersByUser[u].count += 1;
      ordersByUser[u].total += Number(o.total || 0);
    }

    return all.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatar: u.avatar,
      role: u.role,
      provider: u.provider,
      emailVerified: u.emailVerified,
      phoneVerified: u.phoneVerified,
      createdAt: u.createdAt,
      lastSignInAt: u.lastSignInAt,
      orderCount: ordersByUser[Number(u.id)]?.count ?? 0,
      orderTotal: ordersByUser[Number(u.id)]?.total ?? 0,
    }));
  }),

  stats: adminQuery.query(async () => {
    const db = getDb();
    const all = await db.select().from(users);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const byRole = { client: 0, agent: 0, admin: 0 };
    const byProvider: Record<string, number> = {};
    let newThisWeek = 0;
    for (const u of all) {
      byRole[u.role] = (byRole[u.role] ?? 0) + 1;
      byProvider[u.provider] = (byProvider[u.provider] ?? 0) + 1;
      if (new Date(u.createdAt).getTime() >= weekAgo) newThisWeek += 1;
    }
    return { total: all.length, byRole, byProvider, newThisWeek };
  }),

  updateRole: adminQuery
    .input(z.object({ id: z.number(), role: z.enum(["client", "agent", "admin"]) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      if (Number(input.id) === Number(ctx.user.id) && input.role !== "admin") {
        throw new Error("No puedes quitarte el rol de administrador a ti mismo");
      }
      await db.update(users).set({ role: input.role }).where(eq(users.id, input.id));

      // Keep the agents table consistent when promoting to / demoting from agent
      if (input.role === "agent") {
        const existing = await db.select().from(agents).where(eq(agents.userId, input.id)).limit(1);
        if (existing.length === 0) {
          await db.insert(agents).values({
            userId: input.id,
            code: `AG-${String(input.id).padStart(4, "0")}`,
            status: "offline",
          });
        }
      }
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      if (Number(input.id) === Number(ctx.user.id)) throw new Error("No puedes eliminar tu propia cuenta");
      const rows = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
      if (rows[0]?.role === "admin") throw new Error("No se puede eliminar a otro administrador");
      await db.delete(agents).where(eq(agents.userId, input.id));
      await db.delete(users).where(eq(users.id, input.id));
      return { success: true };
    }),

  bulkDelete: adminQuery
    .input(z.object({ ids: z.array(z.number()).min(1) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const ids = input.ids.filter((id) => Number(id) !== Number(ctx.user.id));
      if (ids.length === 0) return { success: true, count: 0 };
      const targets = await db.select().from(users).where(inArray(users.id, ids));
      const deletable = targets.filter((u) => u.role !== "admin").map((u) => Number(u.id));
      if (deletable.length === 0) return { success: true, count: 0 };
      await db.delete(agents).where(inArray(agents.userId, deletable));
      await db.delete(users).where(inArray(users.id, deletable));
      return { success: true, count: deletable.length };
    }),
});
