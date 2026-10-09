// @ts-nocheck
/**
 * Idempotent migration for the v3 auth + products upgrade.
 * Adds new columns/tables only if they don't already exist — safe to run repeatedly.
 *
 *   npx tsx db/migrate-v3.ts        (or: node --import tsx db/migrate-v3.ts)
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL no está definido en el entorno (.env)");
  process.exit(1);
}

async function columnExists(conn: any, table: string, column: string): Promise<boolean> {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return rows[0].c > 0;
}

async function tableExists(conn: any, table: string): Promise<boolean> {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table],
  );
  return rows[0].c > 0;
}

async function run() {
  const conn = await mysql.createConnection(DB_URL);
  console.log("Conectado a la base de datos. Aplicando migración v3...");

  const steps: { label: string; check: () => Promise<boolean>; sql: string }[] = [
    {
      label: "users.phone",
      check: () => columnExists(conn, "users", "phone"),
      sql: "ALTER TABLE users ADD COLUMN phone VARCHAR(32) NULL UNIQUE",
    },
    {
      label: "users.phoneVerified",
      check: () => columnExists(conn, "users", "phoneVerified"),
      sql: "ALTER TABLE users ADD COLUMN phoneVerified TINYINT(1) NOT NULL DEFAULT 0",
    },
    {
      label: "users.provider (+phone)",
      check: async () => {
        const [rows] = await conn.query(
          `SELECT COLUMN_TYPE AS t FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='provider'`,
        );
        return !!rows[0]?.t?.includes("'phone'");
      },
      sql: "ALTER TABLE users MODIFY COLUMN provider ENUM('local','google','facebook','twitter','phone') NOT NULL DEFAULT 'local'",
    },
    {
      label: "products.originalPrice",
      check: () => columnExists(conn, "products", "originalPrice"),
      sql: "ALTER TABLE products ADD COLUMN originalPrice DECIMAL(10,2) NULL",
    },
    {
      label: "products.images",
      check: () => columnExists(conn, "products", "images"),
      sql: "ALTER TABLE products ADD COLUMN images TEXT NULL",
    },
    {
      label: "phoneOtps table",
      check: () => tableExists(conn, "phoneOtps"),
      sql: `CREATE TABLE phoneOtps (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(32) NOT NULL,
        code VARCHAR(10) NOT NULL,
        purpose ENUM('register','login') NOT NULL DEFAULT 'login',
        consumed TINYINT(1) NOT NULL DEFAULT 0,
        attempts INT NOT NULL DEFAULT 0,
        expiresAt TIMESTAMP NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_phone (phone)
      )`,
    },
    // ── Guest checkout + payments (v3.1) ──
    {
      label: "orders.guestName",
      check: () => columnExists(conn, "orders", "guestName"),
      sql: "ALTER TABLE orders ADD COLUMN guestName VARCHAR(255) NULL",
    },
    {
      label: "orders.guestEmail",
      check: () => columnExists(conn, "orders", "guestEmail"),
      sql: "ALTER TABLE orders ADD COLUMN guestEmail VARCHAR(320) NULL",
    },
    {
      label: "orders.guestPhone",
      check: () => columnExists(conn, "orders", "guestPhone"),
      sql: "ALTER TABLE orders ADD COLUMN guestPhone VARCHAR(32) NULL",
    },
    {
      label: "orders.paymentMethod",
      check: () => columnExists(conn, "orders", "paymentMethod"),
      sql: "ALTER TABLE orders ADD COLUMN paymentMethod ENUM('stripe','paypal','mercadopago','spei','cash') DEFAULT 'stripe'",
    },
    {
      label: "orders.paymentId",
      check: () => columnExists(conn, "orders", "paymentId"),
      sql: "ALTER TABLE orders ADD COLUMN paymentId VARCHAR(255) NULL",
    },
    {
      label: "orders.paymentStatus",
      check: () => columnExists(conn, "orders", "paymentStatus"),
      sql: "ALTER TABLE orders ADD COLUMN paymentStatus ENUM('pending','paid','failed','refunded') DEFAULT 'pending'",
    },
    {
      label: "orders.userId nullable",
      check: async () => {
        const [rows] = await conn.query(
          `SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='userId'`
        );
        return rows[0]?.IS_NULLABLE === "YES";
      },
      sql: "ALTER TABLE orders MODIFY COLUMN userId BIGINT UNSIGNED NULL",
    },
  ];

  for (const step of steps) {
    try {
      if (await step.check()) {
        console.log(`  ✓ ${step.label} ya existe — omitido`);
      } else {
        await conn.query(step.sql);
        console.log(`  + ${step.label} aplicado`);
      }
    } catch (err: any) {
      console.error(`  ✗ ${step.label} falló:`, err.message);
    }
  }

  await conn.end();
  console.log("Migración v3 completada.");
}

run().catch((e) => { console.error(e); process.exit(1); });
