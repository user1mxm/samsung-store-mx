// Dedicated test schema only. Exercises real password verification, signed cookies,
// identity lookup, role enforcement and the compiled admin form. No production access.
import assert from 'node:assert/strict'
import { createPool } from 'mysql2/promise'
import { hashPassword } from '../api/lib/password-core.mjs'
import { createHash, randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
if(!process.env.MYSQL_TEST_URL){console.log('Admin MySQL browser integration requires MYSQL_TEST_URL (dedicated test schema)');process.exit(0)}
assert.equal(new URL(process.env.MYSQL_TEST_URL).pathname,'/samsung_store_test')
const pool=createPool(process.env.MYSQL_TEST_URL)
const password=`fixture-${randomUUID()}`,secret='fixture-auth-secret-only'
let server,browser
const emails=['admin-fixture@example.invalid','client-fixture@example.invalid','legacy-fixture@example.invalid']
try {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, unionId VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL, email VARCHAR(320) UNIQUE, avatar TEXT, password VARCHAR(255),
    provider ENUM('local','google','facebook','twitter') DEFAULT 'local' NOT NULL,
    emailVerified BOOLEAN DEFAULT FALSE NOT NULL, mustChangePassword BOOLEAN DEFAULT FALSE NOT NULL,
    passwordResetToken VARCHAR(255), passwordResetExpiry TIMESTAMP NULL,
    role ENUM('client','agent','admin') DEFAULT 'client' NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    lastSignInAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL) ENGINE=InnoDB`)
  await pool.execute('DELETE FROM users WHERE email IN (?,?,?)',emails)
  for(let i=0;i<emails.length;i++)await pool.execute('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)',['Fixture',emails[i],i===2?createHash('sha256').update(password+secret).digest('hex'):await hashPassword(password),i===1?'client':'admin'])
  const listener=createServer();listener.listen(0,'127.0.0.1');await once(listener,'listening');const port=listener.address().port;await new Promise(r=>listener.close(r))
  const origin=`http://127.0.0.1:${port}`
  server=spawn(process.execPath,['dist/boot.js'],{env:{...process.env,NODE_ENV:'production',BIND_HOST:'127.0.0.1',PORT:String(port),APP_ID:'fixture-auth',APP_SECRET:secret,DATABASE_URL:process.env.MYSQL_TEST_URL,KIMI_AUTH_URL:'https://example.invalid',KIMI_OPEN_URL:'https://example.invalid',PAYMENTS_ENABLED:'0'},stdio:['ignore','pipe','pipe']})
  let output='';server.stderr.on('data',d=>output+=d)
  for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error(output);try{if((await fetch(origin)).ok)break}catch{}await delay(100)}
  const login=(email,pass=password,isAdmin=true)=>fetch(origin+'/api/trpc/localAuth.login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({json:{email,password:pass,isAdmin}})})
  const invalid=await login(emails[0],'wrong');assert.equal(invalid.headers.get('set-cookie'),null);assert.notEqual(invalid.status,200)
  const client=await login(emails[1]);assert.equal(client.headers.get('set-cookie'),null);assert.notEqual(client.status,200)
  for(const email of [emails[0],emails[2]]){
    const response=await login(' '+email.toUpperCase()+' ');assert.equal(response.status,200)
    const setCookie=response.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/i);assert.match(setCookie,/Path=\//)
    const cookie=setCookie.split(';')[0]
    const me=await fetch(origin+'/api/trpc/localAuth.me',{headers:{cookie}});const identity=(await me.json()).result.data.json
    assert.equal(identity.role,'admin');assert.equal('password' in identity,false)
    assert.equal((await fetch(origin+'/api/trpc/user.list',{headers:{cookie}})).status,200)
  }
  assert.notEqual((await fetch(origin+'/api/trpc/user.list')).status,200)
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||chromium.executablePath()})
  const page=await browser.newPage({viewport:{width:390,height:844}})
  await page.route('**/api/trpc/**',route=>{
    const names=decodeURIComponent(new URL(route.request().url()).pathname.split('/api/trpc/')[1]).split(',')
    if(names.some(n=>n.startsWith('localAuth.')||n==='user.list'))return route.continue()
    const result=names.map(()=>({result:{data:{json:[]}}}));return route.fulfill({contentType:'application/json',body:JSON.stringify(new URL(route.request().url()).searchParams.has('batch')?result:result[0])})
  })
  await page.goto(origin+'/webmaster');await page.waitForURL('**/login/admin')
  await page.getByRole('textbox',{name:'Correo administrador'}).fill(emails[0]);await page.getByLabel('Contraseña',{exact:true}).fill('wrong')
  await page.getByRole('button',{name:'Ingresar al panel'}).click();await page.getByRole('alert').filter({hasText:'Credenciales inválidas'}).waitFor()
  await page.getByLabel('Contraseña',{exact:true}).fill(password);await page.getByRole('button',{name:'Ingresar al panel'}).click()
  await page.waitForURL('**/admin');await page.getByText('Panel Administrativo',{exact:true}).waitFor();await page.reload();await page.getByText('Panel Administrativo',{exact:true}).waitFor()
  console.log('Admin integration passed: scrypt/legacy, normalized email, invalid/client refusal, HTTP cookie round-trip, protected API, visible failure, login navigation and reload')
} finally {
  await browser?.close()
  if(server&&server.exitCode===null){const exit=once(server,'exit');server.kill('SIGTERM');await exit}
  await pool.execute('DELETE FROM users WHERE email IN (?,?,?)',emails);await pool.end()
}
