import test from 'node:test';
import assert from 'node:assert/strict';
import { createPool } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';
import { migrateCommerce } from '../api/commerce/migrate.mjs';
import { previewCatalog,applyCatalog } from '../api/admin-tools/catalog.mjs';
import { listRates,saveRate } from '../api/admin-tools/rates.mjs';
import { hashPassword } from '../api/lib/password-core.mjs';

test('admin tools persist atomically in an isolated MySQL database',{skip:!process.env.MYSQL_TEST_URL},async t=>{
  assert.equal(new URL(process.env.MYSQL_TEST_URL).pathname,'/samsung_store_test');
  const pool=createPool(process.env.MYSQL_TEST_URL);
  let server,browser;
  try {
    await migrateCommerce(pool);
    for(const [name,type] of Object.entries({model:'VARCHAR(100)',category:"VARCHAR(100) DEFAULT 'oled'",imageUrl:'TEXT',description:'TEXT',features:'TEXT',specs:'TEXT',rating:"DECIMAL(2,1) DEFAULT '0.0'",featured:"VARCHAR(3) DEFAULT 'no'",createdAt:'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'})) {
      const [r]=await pool.query(`SHOW COLUMNS FROM products LIKE '${name}'`);if(!r.length)await pool.query(`ALTER TABLE products ADD COLUMN ${name} ${type}`);
    }
    await pool.query('ALTER TABLE products MODIFY id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT');
    await pool.query('CREATE TABLE IF NOT EXISTS categories (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100),slug VARCHAR(100) UNIQUE,imageUrl TEXT,createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
    await pool.query('CREATE TABLE IF NOT EXISTS agents (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,userId BIGINT UNSIGNED UNIQUE,code VARCHAR(50) UNIQUE,specialty VARCHAR(255),phone VARCHAR(50),commission DECIMAL(10,2) DEFAULT 0,totalSales DECIMAL(10,2) DEFAULT 0,status VARCHAR(20) DEFAULT \'offline\',createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
    await pool.query('CREATE TABLE IF NOT EXISTS referrals (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,userId BIGINT UNSIGNED UNIQUE,referrerId BIGINT UNSIGNED,referralCode VARCHAR(20) UNIQUE,level INT DEFAULT 1,totalEarnings DECIMAL(12,2) DEFAULT 0,totalNetworkSales DECIMAL(12,2) DEFAULT 0,networkSize INT DEFAULT 0,createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
    await pool.query("INSERT IGNORE INTO categories (name,slug) VALUES ('OLED','oled'),('Crystal','crystal')");
    const password='demo-only-admin-tools';
    for(const [id,name,role] of [[90001,'Administrador de demostración','admin'],[90002,'Agente de demostración','agent'],[90003,'Miembro de demostración','client']])await pool.execute('INSERT INTO users (id,name,email,role,password) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),role=VALUES(role),password=VALUES(password)',[id,name,`demo-${id}@example.invalid`,role,await hashPassword(password)]);
    await pool.query("INSERT INTO agents (userId,code,commission) VALUES (90002,'DEMO-002',55) ON DUPLICATE KEY UPDATE commission=55");
    await pool.query("INSERT INTO referrals (userId,referrerId,referralCode) VALUES (90002,NULL,'DEMOAGENT'),(90003,90002,'DEMOMEMBER') ON DUPLICATE KEY UPDATE referrerId=VALUES(referrerId)");
    await pool.query("DELETE FROM storeSettings WHERE name='agentRate:90002'");
    await pool.query('DELETE FROM ambassador_commissions WHERE ambassadorId=90002');
    await pool.execute("INSERT INTO products (id,name,model,category,price,stock,imageUrl) VALUES (90001,'Samsung OLED 65 — demostración','QN65S95DAFXZX','oled',25000,3,'/logo-samsung-mx.png') ON DUPLICATE KEY UPDATE price=25000,stock=3");
    const rows=[{id:90001,data:{price:'24000',stock:4}},{data:{name:'Crystal 75 — demostración',model:'UN75DU8000FXZX',category:'crystal',price:'15000',stock:2,imageUrl:'/logo-samsung-mx.png'}}];
    await t.test('preview writes no products; a mixed create/update batch is atomic and idempotent',async()=>{
      const plan=await previewCatalog(pool,rows);assert.equal(plan.errors.length,0);assert.equal(plan.creates,1);assert.equal(plan.updates,1);
      assert.equal((await pool.query('SELECT stock FROM products WHERE id=90001'))[0][0].stock,3);
      const key=randomUUID(),first=await applyCatalog(pool,90001,rows,plan.token,key),again=await applyCatalog(pool,90001,rows,plan.token,key);assert.deepEqual(again,first);
      assert.equal((await pool.query("SELECT COUNT(*) AS n FROM products WHERE model='UN75DU8000FXZX'"))[0][0].n,1);
      assert.equal((await pool.query('SELECT stock FROM products WHERE id=90001'))[0][0].stock,4);
      await assert.rejects(applyCatalog(pool,90002,rows,plan.token,key));
    });
    await t.test('stale inventory, invalid rows and concurrent commits cannot overwrite or partially save',async()=>{
      const change=[{id:90001,data:{price:'23000'}}],plan=await previewCatalog(pool,change);
      await pool.query('UPDATE products SET stock=stock-1 WHERE id=90001');
      await assert.rejects(applyCatalog(pool,90001,change,plan.token,randomUUID()),/cambió/);
      assert.equal(Number((await pool.query('SELECT price FROM products WHERE id=90001'))[0][0].price),24000);
      const bad=[{id:90001,data:{stock:9}},{id:999999,data:{stock:9}}],badPlan=await previewCatalog(pool,bad);
      await assert.rejects(applyCatalog(pool,90001,bad,badPlan.token,randomUUID()));assert.equal((await pool.query('SELECT stock FROM products WHERE id=90001'))[0][0].stock,3);
      const p=await previewCatalog(pool,change),results=await Promise.allSettled([1,2].map(()=>applyCatalog(pool,90001,change,p.token,randomUUID())));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    });
    await t.test('rates persist with beneficiary, audit and conflict checks without changing balances',async()=>{
      let all=await listRates(pool),agent=all.agents.find(a=>Number(a.userId)===90002),link=all.network.find(a=>Number(a.memberId)===90003);
      const input={kind:'agent',userId:90002,rate:10,expectedVersion:agent.version,reason:'Acuerdo de demostración'};await saveRate(pool,90001,input);await assert.rejects(saveRate(pool,90001,{...input,rate:12}),/cambió/);
      await saveRate(pool,90001,{kind:'network',userId:90002,memberId:90003,rate:6.5,expectedVersion:link.version,reason:'Acuerdo de demostración'});
      all=await listRates(pool);assert.equal(all.agents.find(a=>Number(a.userId)===90002).rate,10);assert.equal(all.network.find(a=>Number(a.memberId)===90003).rate,6.5);
      assert.equal(Number((await pool.query('SELECT commission FROM agents WHERE userId=90002'))[0][0].commission),55);
      const [events]=await pool.query("SELECT details FROM storeAudit WHERE action='commission.rate' AND resourceId='90002'");assert.equal(events.length>=2,true);
      await assert.rejects(saveRate(pool,90001,{kind:'network',userId:90003,memberId:90002,rate:8,expectedVersion:link.version,reason:'Invalid relationship'}));
    });
    await t.test('source evidence survives price edits and is invalidated by content changes',async()=>{
      const source='https://www.samsung.com/mx/support/model/QN65S95DAFXZX/';
      const rows=[{id:90001,data:{},evidence:{sourceUrl:source,sourceModel:'QN65S95DAFXZX',imageSourceUrl:source,status:'reviewed',notes:'Fixture source'}}];
      await applyCatalog(pool,90001,rows,(await previewCatalog(pool,rows)).token,randomUUID());
      for(const data of [{price:'22900'},{description:'Updated description'}]) {const r=[{id:90001,data}];await applyCatalog(pool,90001,r,(await previewCatalog(pool,r)).token,randomUUID());}
      const [s]=await pool.query("SELECT body FROM storeSettings WHERE name='productSource:90001'");assert.equal((typeof s[0].body==='string'?JSON.parse(s[0].body):s[0].body).status,'pending');
    });
    await t.test('compiled API and desktop/mobile UI run against the same real fixture database',async()=>{
      const listener=createServer();listener.listen(0,'127.0.0.1');await once(listener,'listening');const port=listener.address().port;await new Promise(r=>listener.close(r));const origin=`http://localhost:${port}`;
      server=spawn(process.execPath,['dist/boot.js'],{env:{...process.env,NODE_ENV:'production',BIND_HOST:'127.0.0.1',PORT:String(port),APP_ID:'admin-tools-fixture',APP_SECRET:'test-only-admin-tools-secret',DATABASE_URL:process.env.MYSQL_TEST_URL,SITE_ORIGIN:origin,PAYMENTS_ENABLED:'0'},stdio:['ignore','pipe','pipe']});let logs='';server.stderr.on('data',d=>logs+=d);
      for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error(logs);try{if((await fetch(origin)).ok)break;}catch{}await delay(100);}
      const post=(name,data,cookie)=>fetch(`${origin}/api/trpc/${name}`,{method:'POST',headers:{'content-type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify({json:data})});
      const auth=await post('localAuth.login',{email:'demo-90001@example.invalid',password,isAdmin:true});assert.equal(auth.status,200);const cookie=auth.headers.get('set-cookie').split(';')[0];
      assert.equal((await post('adminTools.preview',{rows:[{id:90001,data:{stock:5}}]},cookie)).status,200);
      assert.notEqual((await post('adminTools.preview',{rows:[{id:90001,data:{stock:5}}]})).status,200);
      await mkdir('test-artifacts/admin-guide',{recursive:true});
      browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||chromium.executablePath()});const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(origin+'/login/admin');await page.getByPlaceholder('Correo administrador').waitFor();await page.screenshot({path:'test-artifacts/admin-guide/01-login.png'});
      await context.addCookies([{name:cookie.split('=')[0],value:cookie.slice(cookie.indexOf('=')+1),url:origin}]);
      await page.goto(origin+'/admin/catalogo');await page.getByRole('heading',{name:'Catálogo y comisiones'}).waitFor();await page.getByRole('checkbox',{name:'Seleccionar QN65S95DAFXZX 90001',exact:true}).check();await page.screenshot({path:'test-artifacts/admin-guide/02-catalog.png'});
      await page.getByRole('button',{name:'Editar seleccionados (1)',exact:true}).click();await page.getByLabel('price fila 1',{exact:true}).fill('22500');await page.getByRole('button',{name:'Ficha y fuentes',exact:true}).click();await page.getByRole('heading',{name:'Ficha y fuentes · fila 1'}).scrollIntoViewIfNeeded();await page.screenshot({path:'test-artifacts/admin-guide/03-edit.png'});
      await page.getByRole('button',{name:'Revisar lote',exact:true}).click();await page.getByRole('heading',{name:'3. Confirma los cambios'}).waitFor();await page.getByRole('heading',{name:'3. Confirma los cambios'}).scrollIntoViewIfNeeded();await page.screenshot({path:'test-artifacts/admin-guide/04-preview.png'});
      await page.getByRole('button',{name:'Guardar 1 productos',exact:true}).click();await page.getByText('Lote guardado: 0 creados y 1 actualizados',{exact:true}).waitFor();assert.equal(Number((await pool.query('SELECT price FROM products WHERE id=90001'))[0][0].price),22500);
      await page.getByRole('button',{name:'Porcentajes y red',exact:true}).click();await page.getByRole('heading',{name:'Agentes · venta propia'}).waitFor();await page.screenshot({path:'test-artifacts/admin-guide/05-rates.png'});
      await page.getByRole('heading',{name:'Red de mercadeo · vínculos directos'}).scrollIntoViewIfNeeded();await page.screenshot({path:'test-artifacts/admin-guide/06-network.png'});
      await page.getByLabel('Porcentaje agent 90002',{exact:true}).fill('11');const card=page.locator('article').filter({has:page.getByLabel('Porcentaje agent 90002',{exact:true})});await card.getByLabel('Motivo del cambio').fill('Validación de guardado en interfaz');await card.getByRole('button',{name:'Guardar porcentaje',exact:true}).click();await page.getByText('Porcentaje guardado',{exact:true}).waitFor();await page.reload();await page.getByRole('button',{name:'Porcentajes y red',exact:true}).click();await page.getByLabel('Porcentaje agent 90002',{exact:true}).waitFor();assert.equal(await page.getByLabel('Porcentaje agent 90002',{exact:true}).inputValue(),'11');
      await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'test-artifacts/admin-guide/07-mobile.png'});assert.deepEqual(errors,[]);
    });
  } finally {await browser?.close();if(server&&server.exitCode===null){const exit=once(server,'exit');server.kill('SIGTERM');await exit;}await pool.end();}
});
