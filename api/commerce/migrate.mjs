import { readFile } from 'node:fs/promises';
const tables=['storeAudit','productProfiles','storeSettings','storeQuotes','supportCases','supportMessages','supportFiles','serviceZones','serviceBookings','inventoryChannels','inventoryEvents','inventoryOutbox','rewardLedger','rewardBenefits','rewardRedemptions','paymentRefunds','adminPasskeys','passkeyChallenges'];
export async function migrateCommerce(connection) {
 const sql=await readFile(new URL('../../db/migrations/20261009_commerce.sql',import.meta.url),'utf8');
 for(const statement of sql.split(';').filter(s=>s.trim()))await connection.query(statement);
 const [rows]=await connection.query('SELECT TABLE_NAME AS name,ENGINE AS engine FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN (?)',[tables]);
 if(rows.length!==tables.length||rows.some(r=>r.engine!=='InnoDB'))throw Error('Commerce migration gate failed');
}
