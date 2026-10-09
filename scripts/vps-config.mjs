import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';

export function runtimeConfig(live, runtimeFile) {
  const app = JSON.parse(readFileSync(runtimeFile, 'utf8')).find(row => row.name === 'samsung-store');
  if (!app || app.pm2_env.pm_cwd !== live || app.pm2_env.pm_exec_path !== `${live}/dist/boot.js`) throw new Error('Unexpected PM2 process; inspect before deployment');
  let file = {};
  try { file = parse(readFileSync(`${live}/.env`)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const strings = Object.fromEntries(Object.entries(app.pm2_env).filter(([, value]) => typeof value === 'string'));
  const config = { ...file, ...strings, ...app.pm2_env.env };
  if (config.PAYMENTS_ENABLED === '1') throw new Error('Payments are already enabled; reconcile in-flight payments before changing the deployment');
  if (!config.DATABASE_URL || !config.APP_ID || !config.APP_SECRET) throw new Error('Production database/session configuration is incomplete');
  return config;
}
