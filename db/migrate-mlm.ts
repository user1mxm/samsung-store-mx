// Samsung Store MX — Migración MLM: agrega commissionRate a referrals
import { getDb } from "../api/queries/connection";
import { sql } from "drizzle-orm";

async function createTables() {
  const db = getDb();

  // Agregar commissionRate a referrals si no existe
  try {
    await db.execute(sql`
      ALTER TABLE referrals
        ADD COLUMN IF NOT EXISTS commissionRate DECIMAL(5,2) DEFAULT 8.00,
        ADD COLUMN IF NOT EXISTS subAgentLimit INT DEFAULT 40,
        ADD COLUMN IF NOT EXISTS role ENUM('ambassador','leader','manager','director') DEFAULT 'ambassador'
    `);
    console.log("✓ referrals: commissionRate, subAgentLimit, role");
  } catch(e: any) {
    if (!e.message?.includes("Duplicate")) console.warn("referrals alter:", e.message);
  }

  // Tabla de configuración de comisiones por embajador→sub-agente
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ambassador_commissions (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      ambassadorId BIGINT UNSIGNED NOT NULL,
      subAgentId   BIGINT UNSIGNED NOT NULL,
      rate         DECIMAL(5,2) NOT NULL DEFAULT 8.00,
      notes        VARCHAR(255),
      createdAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_amb_sub (ambassadorId, subAgentId)
    )
  `);
  console.log("✓ ambassador_commissions");

  console.log("✅ Migración MLM completada");
}

createTables().catch(e => { console.error("❌ Error:", e.message); process.exit(1); });
