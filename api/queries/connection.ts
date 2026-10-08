import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import { createPool } from "mysql2/promise";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;
let orderPool: ReturnType<typeof createPool>;

export function getOrderPool() {
  // Orders require one physical connection for the whole transaction.
  return orderPool ??= createPool(env.databaseUrl);
}

export function getDb() {
  if (!instance) {
    instance = drizzle(env.databaseUrl, {
      mode: "planetscale",
      schema: fullSchema,
    });
  }
  return instance;
}
