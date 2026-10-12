// @ts-nocheck
import { randomUUID } from 'node:crypto';
import { previewCatalog,applyCatalog,productFields } from './admin-tools/catalog.mjs';
import { getOrderPool } from './queries/connection';
import { transaction,audit } from './commerce/core.mjs';
import { searchCatalog } from '../src/lib/catalog-search.mjs';
import { toCents,fromCents } from './payments/money.mjs';
import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { products, categories } from "@db/schema";
import { eq, like, desc } from "drizzle-orm";

export const productRouter = createRouter({
  list: publicQuery
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      featured: z.enum(["yes","no"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const all = await db.select().from(products).orderBy(desc(products.createdAt));
      return searchCatalog(all,input?.search).filter(p => {
        if (input?.category && input.category !== "all" && p.category !== input.category) return false;
        if (input?.featured && p.featured !== input.featured) return false;
        return true;
      });
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
    .input(z.object({
      name: z.string().min(1),
      model: z.string().min(1),
      category: z.string().min(1),
      price: z.string().or(z.number()),
      comparePrice: z.string().or(z.number()).optional(),
      imageUrl: z.string(),
      description: z.string().optional(),
      features: z.array(z.string()).optional(),
      specs: z.record(z.string(), z.string()).optional(),
      stock: z.number().int().min(0).max(2147483647).default(0),
      rating: z.string().optional(),
      featured: z.enum(["yes","no"]).default("no"),
    }))
    .mutation(async ({ input,ctx }) => {
      const {comparePrice,...data}=input;
      const rows=[{data:productFields.parse(data)}],pool=getOrderPool();
      const plan=await previewCatalog(pool,rows);
      const result=await applyCatalog(pool,ctx.user.id,rows,plan.token,randomUUID());
      return {success:true,id:result.ids[0]};
    }),

  // update completo — soporta todos los campos
  update: adminQuery
    .input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        model: z.string().optional(),
        category: z.string().optional(),
        price: z.string().or(z.number()).optional(),
        comparePrice: z.string().or(z.number()).optional(),
        imageUrl: z.string().optional(),
        description: z.string().optional(),
        features: z.array(z.string()).optional(),
        specs: z.record(z.string(), z.string()).optional(),
        stock: z.number().int().min(0).max(2147483647).optional(),
        rating: z.string().optional(),
        featured: z.enum(["yes","no"]).optional(),
      }),
    }))
    .mutation(async ({ input,ctx }) => {
      const {comparePrice,...data}=input.data;
      const rows=[{id:input.id,data:productFields.parse(data)}],pool=getOrderPool();
      const plan=await previewCatalog(pool,rows);
      return applyCatalog(pool,ctx.user.id,rows,plan.token,randomUUID());
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(({input,ctx})=>transaction(getOrderPool(),async c=>{
      await c.execute("INSERT IGNORE INTO storeSettings (name,body) VALUES ('catalogWriteLock','{}')");
      await c.execute("SELECT name FROM storeSettings WHERE name='catalogWriteLock' FOR UPDATE");
      await c.execute('DELETE FROM products WHERE id=?',[input.id]);
      await audit(c,ctx.user.id,'catalog.delete',input.id);
      return {success:true};
    })),
});
