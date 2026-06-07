import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { reviews, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const reviewRouter = createRouter({
  list: publicQuery
    .input(z.object({ productId: z.number() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      let rows;
      if (input?.productId) {
        rows = await db.select().from(reviews).where(eq(reviews.productId, input.productId)).orderBy(desc(reviews.createdAt));
      } else {
        rows = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
      }
      const enriched = [];
      for (const r of rows) {
        const u = await db.select().from(users).where(eq(users.id, r.userId)).limit(1);
        enriched.push({ ...r, authorName: u[0]?.name ?? "Usuario" });
      }
      return enriched;
    }),

  create: authedQuery
    .input(
      z.object({
        productId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [result] = await db.insert(reviews).values({
        productId: input.productId,
        userId: ctx.user.id,
        rating: input.rating,
        comment: input.comment ?? "",
      });
      return { success: true, id: result.insertId };
    }),
});
