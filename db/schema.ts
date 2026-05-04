import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  decimal,
  bigint,
  boolean,
} from "drizzle-orm/mysql-core";

/* ─── USUARIOS ─── */
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).unique(),
  avatar: text("avatar"),
  password: varchar("password", { length: 255 }),
  provider: mysqlEnum("provider", ["local", "google", "facebook", "twitter"]).default("local").notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  mustChangePassword: boolean("mustChangePassword").default(false).notNull(),
  passwordResetToken: varchar("passwordResetToken", { length: 255 }),
  passwordResetExpiry: timestamp("passwordResetExpiry"),
  role: mysqlEnum("role", ["client", "agent", "admin"]).default("client").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/* ─── CATEGORIAS ─── */
export const categories = mysqlTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;

/* ─── PRODUCTOS ─── */
export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  description: text("description"),
  features: text("features"),
  specs: text("specs"),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0"),
  stock: int("stock").default(0).notNull(),
  featured: mysqlEnum("featured", ["yes", "no"]).default("no"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/* ─── ORDENES ─── */
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  agentId: bigint("agentId", { mode: "number", unsigned: true }),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
  shippingAddress: text("shippingAddress"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;

/* ─── ORDER ITEMS ─── */
export const orderItems = mysqlTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull(),
  productId: bigint("productId", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;

/* ─── AGENTES ─── */
export const agents = mysqlTable("agents", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().unique(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  specialty: varchar("specialty", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  commission: decimal("commission", { precision: 10, scale: 2 }).default("0.00"),
  totalSales: decimal("totalSales", { precision: 10, scale: 2 }).default("0.00"),
  status: mysqlEnum("status", ["online", "busy", "offline"]).default("offline"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;

/* ─── REVIEWS ─── */
export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  productId: bigint("productId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;

/* ─── CART (para usuarios logueados) ─── */
export const cartItems = mysqlTable("cartItems", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  productId: bigint("productId", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;

/* ─── REFERRALS / RED DE MERCADEO ─── */
export const referrals = mysqlTable("referrals", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().unique(),
  referrerId: bigint("referrerId", { mode: "number", unsigned: true }),
  referralCode: varchar("referralCode", { length: 20 }).notNull().unique(),
  level: int("level").default(1).notNull(), // 1=embajador, 2=lider, 3=gerente, 4=director
  totalEarnings: decimal("totalEarnings", { precision: 12, scale: 2 }).default("0.00"),
  totalNetworkSales: decimal("totalNetworkSales", { precision: 12, scale: 2 }).default("0.00"),
  networkSize: int("networkSize").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;

/* ─── COMISIONES ─── */
export const commissions = mysqlTable("commissions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(), // quien recibe
  fromUserId: bigint("fromUserId", { mode: "number", unsigned: true }).notNull(), // quien generó la venta
  orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  level: int("level").notNull(), // nivel en la pirámide (1=directo, 2=indirecto, etc)
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "cancelled"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Commission = typeof commissions.$inferSelect;

/* ─── RETIROS / WITHDRAWALS ─── */
export const withdrawals = mysqlTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: varchar("method", { length: 50 }).notNull(), // spei, oxxo, paypal
  accountInfo: text("accountInfo"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "rejected"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

export type Withdrawal = typeof withdrawals.$inferSelect;
