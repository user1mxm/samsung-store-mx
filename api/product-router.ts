// @ts-nocheck
import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { products, categories } from "@db/schema";
import { eq, like, desc } from "drizzle-orm";

export const productRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        featured: z.enum(["yes", "no"]).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.category && input.category !== "all") {
        conditions.push(eq(products.category, input.category));
      }
      if (input?.search) {
        conditions.push(like(products.name, `%${input.search}%`));
      }
      if (input?.featured) {
        conditions.push(eq(products.featured, input.featured));
      }
      
      if (conditions.length > 0) {
        // drizzle syntax
        const all = await db.select().from(products).orderBy(desc(products.createdAt));
        return all.filter(p => {
          if (input?.category && input.category !== "all" && p.category !== input.category) return false;
          if (input?.search && !p.name.toLowerCase().includes(input.search.toLowerCase())) return false;
          if (input?.featured && p.featured !== input.featured) return false;
          return true;
        });
      }
      
      return db.select().from(products).orderBy(desc(products.createdAt));
    }),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
      return rows[0] ?? null;
    }),

  categories: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(categories);
  }),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        model: z.string().min(1),
        category: z.string().min(1),
        price: z.string().or(z.number()),
        imageUrl: z.string().url(),
        description: z.string().optional(),
        features: z.array(z.string()).optional(),
        specs: z.record(z.string()).optional(),
        stock: z.number().default(0),
        featured: z.enum(["yes", "no"]).default("no"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const values = {
        ...input,
        price: String(input.price),
        features: input.features ? JSON.stringify(input.features) : null,
        specs: input.specs ? JSON.stringify(input.specs) : null,
      };
      // @ts-ignore
      const inserted = await db.insert(products).values([values]);
      return { success: true, id: (inserted as any)[0].insertId };
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          price: z.string().or(z.number()).optional(),
          stock: z.number().optional(),
          featured: z.enum(["yes", "no"]).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const updateData: any = { ...input.data };
      if (input.data.price) updateData.price = String(input.data.price);
      await db.update(products).set(updateData).where(eq(products.id, input.id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),
});
