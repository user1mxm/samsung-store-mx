import { createConnection } from 'mysql2/promise';
import { spawn } from 'node:child_process';
import { openSync, closeSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { migrateCommerce } from '../api/commerce/migrate.mjs';
import { runtimeConfig } from './vps-config.mjs';

export async function schemaGate(connection) {
  const [tables] = await connection.query("SELECT TABLE_NAME AS name, ENGINE AS engine FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('products','orders','orderItems','cartItems')");
  if (tables.length !== 4 || tables.some(row => row.engine !== 'InnoDB')) throw new Error('Core order/cart tables must all exist and use InnoDB');
}

export async function migrateAdditions(connection) {
  await schemaGate(connection);
  const [columns] = await connection.query("SHOW COLUMNS FROM orders LIKE 'inventoryReserved'");
  if (!columns.length) await connection.query(readFileSync(new URL('../db/migrations/20261008_order_inventory.sql', import.meta.url), 'utf8'));
  const [column] = await connection.query("SHOW COLUMNS FROM orders LIKE 'inventoryReserved'");
  if (!/^int(?:\(\d+\))?$/i.test(column[0].Type) || column[0].Null !== 'NO' || String(column[0].Default) !== '0') throw new Error('inventoryReserved has an unexpected definition');
  const sql = readFileSync(new URL('../db/migrations/20261008_payment_attempts.sql', import.meta.url), 'utf8');
  for (const statement of sql.split(';').filter(part => part.trim())) await connection.query(statement.replace('CREATE TABLE ', 'CREATE TABLE IF NOT EXISTS '));
  await connection.query('SELECT id,userId,requestKey,inputHash,provider,orderId,snapshot,state,sessionId,checkoutUrl,settlementId,createdAt FROM paymentAttempts LIMIT 0');
  await connection.query('SELECT provider,eventId,attemptId,createdAt FROM paymentEvents LIMIT 0');
  const [indexes] = await connection.query('SHOW INDEX FROM paymentAttempts');
  for (const [name, expected] of [['PRIMARY',['id']], ['user_request',['userId','requestKey']], ['provider_settlement',['provider','settlementId']], ['attempt_order',['orderId']]]) {
    const actual = indexes.filter(row => row.Key_name === name).sort((a,b) => a.Seq_in_index-b.Seq_in_index);
    if (actual.some(row => row.Non_unique !== 0) || JSON.stringify(actual.map(row => row.Column_name)) !== JSON.stringify(expected)) throw new Error(`Unexpected paymentAttempts index: ${name}`);
  }
  const [events] = await connection.query('SHOW INDEX FROM paymentEvents');
  if (JSON.stringify(events.filter(row => row.Key_name === 'PRIMARY').sort((a,b) => a.Seq_in_index-b.Seq_in_index).map(row => row.Column_name)) !== JSON.stringify(['provider','eventId'])) throw new Error('Unexpected paymentEvents primary key');
  const [engines] = await connection.query("SELECT ENGINE AS engine FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('paymentAttempts','paymentEvents')");
  if (engines.length !== 2 || engines.some(row => row.engine !== 'InnoDB')) throw new Error('Payment ledger tables must use InnoDB');
}

async function main() {
  const [mode, live, runtimeFile, backupDir] = process.argv.slice(2);
  const config = runtimeConfig(live, runtimeFile);
  const url = new URL(config.DATABASE_URL);
  const database = decodeURIComponent(url.pathname.slice(1));
  if (url.protocol !== 'mysql:' || !/^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/.test(database)) throw new Error('Unsupported database URL');
  const connection = await createConnection(config.DATABASE_URL);
  try {
    await schemaGate(connection);
    if (mode === 'preflight') { console.log('Database preflight passed: core tables use InnoDB'); return; }
    if (mode !== 'backup-migrate' || !backupDir) throw new Error('Invalid database command');
    const output = openSync(`${backupDir}/database.sql`, 'wx', 0o600);
    const errors = openSync(`${backupDir}/database-backup.stderr`, 'wx', 0o600);
    let status;
    try {
      const child = spawn('mysqldump', ['--single-transaction','--quick','--hex-blob','--no-tablespaces','--routines','--triggers','--events', `--host=${url.hostname}`, `--port=${url.port || '3306'}`, `--user=${decodeURIComponent(url.username)}`, '--databases', database], {
        env: { ...process.env, MYSQL_PWD: decodeURIComponent(url.password) }, stdio: ['ignore', output, errors],
      });
      status = await new Promise((resolve, reject) => { child.once('error',reject); child.once('exit',resolve); });
    } finally { closeSync(output); closeSync(errors); }
    if (status !== 0 || statSync(`${backupDir}/database.sql`).size === 0) throw new Error('Database backup failed; inspect the private backup stderr file');
    writeFileSync(`${backupDir}/database-backup.ok`, new Date().toISOString(), { mode: 0o600 });
    await migrateAdditions(connection);
    await migrateCommerce(connection);
    console.log('Database backup completed; additive migrations verified');
  } finally { await connection.end(); }
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) main().catch(() => {
  console.error('Database step failed. Production deployment must stop; inspect database configuration, permissions and schema privately.');
  process.exitCode = 1;
});
