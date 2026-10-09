import { execFileSync,spawn } from 'node:child_process';
import { readFileSync,writeFileSync,mkdirSync,openSync,closeSync,statSync,existsSync,chmodSync,readdirSync,unlinkSync } from 'node:fs';
import path from 'node:path';
import { createHash,randomBytes } from 'node:crypto';
import { parse } from 'dotenv';
import { createConnection } from 'mysql2/promise';
const live=process.env.SAMSUNG_LIVE_DIR||'/opt/samsung-store-mx';
const processInfo=JSON.parse(execFileSync('pm2',['jlist'],{encoding:'utf8'})).find(p=>p.name==='samsung-store');
if(processInfo?.pm2_env?.pm_cwd!==live)throw new Error('Proceso PM2 inesperado');
let file={};try{file=parse(readFileSync(`${live}/.env`));}catch{}
const config={...file,...Object.fromEntries(Object.entries(processInfo.pm2_env).filter(([,v])=>typeof v==='string')),...processInfo.pm2_env.env};
const dir=process.env.SAMSUNG_MONITOR_DIR||'/opt/samsung-backups/operations';mkdirSync(dir,{recursive:true,mode:0o700});
const mode=process.argv[2]||'health';
const publicOrigin=new URL(config.SITE_ORIGIN||'https://samsungstore.com.mx');if(publicOrigin.protocol!=='https:'&&publicOrigin.hostname!=='localhost')throw new Error('Origen público inválido');
async function child(command,args,output,input,verifyPassword) { const fd=output?openSync(output,'wx',0o600):undefined;const err=output?openSync(output+'.stderr','wx',0o600):undefined;try{const p=spawn(command,args,{env:{...process.env,MYSQL_PWD:verifyPassword??decodeURIComponent(new URL(config.DATABASE_URL).password)},stdio:[input===undefined?'ignore':'pipe',fd??'ignore',err??'ignore']});if(input!==undefined)p.stdin.end(input);const code=await new Promise((r,j)=>{p.once('error',j);p.once('exit',r)});if(code!==0)throw new Error(`${command} falló; consulta el log privado`);}finally{if(fd!==undefined)closeSync(fd);if(err!==undefined)closeSync(err);}}
const url=new URL(config.DATABASE_URL);const database=decodeURIComponent(url.pathname.slice(1));if(!/^[a-zA-Z0-9_]+$/.test(database))throw new Error('Nombre de base inválido');
const args=[`--host=${url.hostname}`,`--port=${url.port||3306}`,`--user=${decodeURIComponent(url.username)}`];
if(mode==='health'){
 const checks={pm2:processInfo.pm2_env.status==='online',api:false,domain:false,database:false,backup:false};
 for(const [key,origin] of [['api','http://127.0.0.1:3001'],['domain',publicOrigin.origin]])try{const r=await fetch(origin+'/api/trpc/ping',{signal:AbortSignal.timeout(10000)});checks[key]=r.ok&&(await r.json()).result?.data?.json?.ok===true;}catch{}
 try{const c=await createConnection(config.DATABASE_URL);await c.query('SELECT 1');await c.end();checks.database=true;}catch{}
 try{const b=JSON.parse(readFileSync(`${dir}/backup-status.json`));checks.backup=b.verified===true&&Date.now()-new Date(b.at).getTime()<48*3600000;}catch{}
 const state={at:new Date().toISOString(),ok:Object.values(checks).every(Boolean),checks};let prior;try{prior=JSON.parse(readFileSync(`${dir}/health.json`));}catch{}writeFileSync(`${dir}/health.json`,JSON.stringify(state,null,2),{mode:0o600});
 if(JSON.stringify(prior?.checks)!==JSON.stringify(checks)){console.log(JSON.stringify(state));writeFileSync(`${dir}/important-alert.json`,JSON.stringify(state),{mode:0o600});}
 if(!state.ok)process.exitCode=1;
}else if(mode==='backup'){
 const stamp=new Date().toISOString().replace(/[:.]/g,'-'),dump=`${dir}/${stamp}.sql`;
 // No CREATE/USE DATABASE, events, routines or triggers: restore verification cannot target production.
 await child('mysqldump',[...args,'--single-transaction','--quick','--hex-blob','--no-tablespaces','--skip-triggers',database],dump);
 if(statSync(dump).size<100)throw new Error('Respaldo vacío');
 const sql=readFileSync(dump,'utf8');if(/(?:^|\n)\s*(CREATE\s+DATABASE|USE\s|CREATE\s+(?:DEFINER\s*=.*?)?(?:EVENT|PROCEDURE|FUNCTION|TRIGGER)\b)/i.test(sql))throw new Error('Dump no apto para verificación aislada');
 const scratch='samsung_restore_'+randomBytes(8).toString('hex');
 const verifyUrl=new URL(config.BACKUP_VERIFY_DATABASE_URL||config.DATABASE_URL);
 if(verifyUrl.hostname!==url.hostname || (verifyUrl.port||'3306')!==(url.port||'3306'))throw new Error('La verificación debe usar el mismo servidor MySQL');
 const c=await createConnection(verifyUrl.href);
 const verifyArgs=[`--host=${verifyUrl.hostname}`,`--port=${verifyUrl.port||3306}`,`--user=${decodeURIComponent(verifyUrl.username)}`];
 try{
  await c.query(`CREATE DATABASE \`${scratch}\``);
  await child('mysql',[...verifyArgs,scratch],undefined,sql,decodeURIComponent(verifyUrl.password));
  const [tables]=await c.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=?',[scratch]);
  for(const name of ['products','orders','orderItems','users','paymentAttempts','storeAudit','productProfiles'])if(!tables.some(r=>r.TABLE_NAME===name))throw new Error('Respaldo sin tabla necesaria');
  const counts={};for(const r of tables){if(!/^[a-zA-Z0-9_]+$/.test(r.TABLE_NAME))throw new Error('Tabla inesperada');const [rows]=await c.query(`SELECT COUNT(*) AS n FROM \`${scratch}\`.\`${r.TABLE_NAME}\``);counts[r.TABLE_NAME]=Number(rows[0].n);}
  const folders=[['uploads',config.UPLOAD_DIR||`${live}/uploads`],['support',config.SUPPORT_PRIVATE_DIR||path.resolve(live,'../samsung-private-support')]];const files={};
  for(const [label,folder] of folders){if(!path.isAbsolute(folder))throw new Error('Las rutas de respaldo de archivos deben ser absolutas');if(!existsSync(folder))continue;const archive=`${dir}/${stamp}-${label}.tar.gz`;execFileSync('tar',['-czf',archive,'-C',folder,'.'],{stdio:'ignore'});execFileSync('tar',['-tzf',archive],{stdio:'ignore'});chmodSync(archive,0o600);files[label]={file:archive,sha256:createHash('sha256').update(readFileSync(archive)).digest('hex')};}
  writeFileSync(`${dir}/backup-status.json`,JSON.stringify({files,at:new Date().toISOString(),verified:true,file:dump,sha256:createHash('sha256').update(sql).digest('hex'),tables:counts},null,2),{mode:0o600});for(const name of readdirSync(dir)){if(/^\d{4}-\d{2}-\d{2}T[\dTZ-]+(?:-uploads\.tar\.gz|-support\.tar\.gz|\.sql(?:\.stderr)?)$/.test(name)){const target=path.join(dir,name);if(Date.now()-statSync(target).mtimeMs>30*86400000)unlinkSync(target);}}console.log('Respaldo restaurado y verificado en base temporal; producción no modificada.');
 }finally{await c.query(`DROP DATABASE IF EXISTS \`${scratch}\``);await c.end();}
}else throw new Error('Usa health o backup');
