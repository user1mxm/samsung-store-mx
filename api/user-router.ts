import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, agents } from "@db/schema";
import { eq, desc, ne } from "drizzle-orm";

export const userRouter = createRouter({
  // Listar todos los usuarios (sin admins excepto el propio)
  list: adminQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        provider: users.provider,
        createdAt: users.createdAt,
        lastSignInAt: users.lastSignInAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    return rows;
  }),

  // Cambiar rol de un usuario
  updateRole: adminQuery
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["client", "agent", "admin"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      // No permitir cambiar el propio rol
      if (input.userId === ctx.user.id) {
        throw new Error("No puedes cambiar tu propio rol");
      }
      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));

      // Si se convierte en agente, crear registro en agents si no existe
      if (input.role === "agent") {
        const existing = await db
          .select()
          .from(agents)
          .where(eq(agents.userId, input.userId))
          .limit(1);
        if (existing.length === 0) {
          const userRow = await db
            .select()
            .from(users)
            .where(eq(users.id, input.userId))
            .limit(1);
          const code = `AGENT-${String(input.userId).padStart(3, "0")}`;
          await db.insert(agents).values({
            userId: input.userId,
            code,
            specialty: "General",
            status: "online",
          });
        }
      }
      return { success: true };
    }),

  // Eliminar usuario
  delete: adminQuery
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      if (input.userId === ctx.user.id) {
        throw new Error("No puedes eliminarte a ti mismo");
      }
      await db.delete(users).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // Aprobar solicitud de agente/embajador (cambiar de client a agent)
  approveAgent: adminQuery
    .input(z.object({ userId: z.number(), code: z.string().optional(), specialty: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(users).set({ role: "agent" }).where(eq(users.id, input.userId));
      const existing = await db.select().from(agents).where(eq(agents.userId, input.userId)).limit(1);
      if (existing.length === 0) {
        await db.insert(agents).values({
          userId: input.userId,
          code: input.code ?? `AGENT-${String(input.userId).padStart(3, "0")}`,
          specialty: input.specialty ?? "General",
          status: "online",
        });
      }
      return { success: true };
    }),

  // Stats de usuarios para el overview
  stats: adminQuery.query(async () => {
    const db = getDb();
    const all = await db.select({ role: users.role }).from(users);
    return {
      total: all.length,
      clients: all.filter((u) => u.role === "client").length,
      agents: all.filter((u) => u.role === "agent").length,
      admins: all.filter((u) => u.role === "admin").length,
    };
  }),
});
