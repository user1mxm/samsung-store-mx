// @ts-nocheck
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { createRouter, publicQuery, adminQuery } from '../middleware';
import { getOrderPool } from '../queries/connection';
import { verifyPassword } from '../lib/password';
import { issueSession } from '../local-auth-router';
const parse = v => typeof v === 'string' ? JSON.parse(v) : v;
function relyingParty() {
  const url = new URL(process.env.SITE_ORIGIN || process.env.PUBLIC_BASE_URL || 'https://samsungstore.com.mx');
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') throw new Error('Passkeys requieren HTTPS');
  return { origin: url.origin, rpID: url.hostname };
}
async function password(userId, value) {
  const [rows] = await getOrderPool().execute('SELECT password,role FROM users WHERE id=?', [userId]);
  if (rows[0]?.role !== 'admin' || !await verifyPassword(value, rows[0].password)) throw new Error('Credenciales inválidas');
}
async function challenge(userId, purpose, value) {
  const id = randomUUID();
  await getOrderPool().execute('DELETE FROM passkeyChallenges WHERE expiresAt < NOW()');
  await getOrderPool().execute('INSERT INTO passkeyChallenges (id,userId,purpose,challenge,expiresAt) VALUES (?,?,?,?,DATE_ADD(NOW(), INTERVAL 5 MINUTE))', [id,userId,purpose,value]);
  return id;
}
async function consume(id, purpose, userId?) {
  const conn = await getOrderPool().getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute('SELECT * FROM passkeyChallenges WHERE id=? AND purpose=? AND expiresAt>NOW() FOR UPDATE', [id,purpose]);
    const row = rows[0];
    if (!row || (userId && Number(row.userId)!==userId)) throw new Error('Solicitud vencida; vuelve a intentarlo');
    await conn.execute('DELETE FROM passkeyChallenges WHERE id=?', [id]);
    await conn.commit(); return row;
  } catch(e) { await conn.rollback(); throw e; } finally { conn.release(); }
}
export const passkeyRouter = createRouter({
  list: adminQuery.query(async ({ctx}) => { const [rows] = await getOrderPool().execute('SELECT id,label,createdAt FROM adminPasskeys WHERE userId=?',[ctx.user.id]); return rows; }),
  registerOptions: adminQuery.input(z.object({password:z.string().min(1).max(200)})).mutation(async ({ctx,input}) => {
    await password(ctx.user.id,input.password);
    const {rpID}=relyingParty();
    const [keys]=await getOrderPool().execute('SELECT id,transports FROM adminPasskeys WHERE userId=?',[ctx.user.id]);
    if(keys.length>=10) throw new Error('Máximo 10 llaves por cuenta');
    const options=await generateRegistrationOptions({rpName:'Samsung Store MX',rpID,userID:new TextEncoder().encode(String(ctx.user.id)),userName:ctx.user.email,attestationType:'none',excludeCredentials:keys.map(k=>({id:k.id,transports:parse(k.transports)||[]})),authenticatorSelection:{residentKey:'required',userVerification:'required'}});
    return {id:await challenge(ctx.user.id,'register',options.challenge),options};
  }),
  register: adminQuery.input(z.object({id:z.string().uuid(),label:z.string().trim().min(1).max(100),response:z.any()})).mutation(async ({ctx,input}) => {
    const ch=await consume(input.id,'register',ctx.user.id); const {rpID,origin}=relyingParty();
    const verification=await verifyRegistrationResponse({response:input.response,expectedChallenge:ch.challenge,expectedOrigin:origin,expectedRPID:rpID,requireUserVerification:true});
    if(!verification.verified || !verification.registrationInfo) throw new Error('Llave no verificada');
    const credential=verification.registrationInfo.credential;
    await getOrderPool().execute('INSERT INTO adminPasskeys (id,userId,publicKey,counter,transports,label) VALUES (?,?,?,?,?,?)',[credential.id,ctx.user.id,Buffer.from(credential.publicKey),credential.counter,JSON.stringify(credential.transports||[]),input.label]);
    return {success:true};
  }),
  remove: adminQuery.input(z.object({id:z.string().min(1).max(255),password:z.string().min(1).max(200)})).mutation(async ({ctx,input}) => { await password(ctx.user.id,input.password); await getOrderPool().execute('DELETE FROM adminPasskeys WHERE id=? AND userId=?',[input.id,ctx.user.id]); return {success:true}; }),
  loginOptions: publicQuery.input(z.object({email:z.string().trim().toLowerCase().email()})).mutation(async ({input}) => {
    const [users]=await getOrderPool().execute("SELECT id FROM users WHERE email=? AND role='admin'",[input.email]);
    const userId=Number(users[0]?.id)||0;
    const [keys]=await getOrderPool().execute('SELECT id,transports FROM adminPasskeys WHERE userId=?',[userId]);
    // Unknown accounts receive the same discoverable ceremony; completion still requires a bound credential.
    const options=await generateAuthenticationOptions({rpID:relyingParty().rpID,userVerification:'required',allowCredentials:keys.map(k=>({id:k.id,transports:parse(k.transports)||[]}))});
    return {id:await challenge(userId,'login',options.challenge),options};
  }),
  login: publicQuery.input(z.object({id:z.string().uuid(),response:z.any()})).mutation(async ({ctx,input}) => {
    const ch=await consume(input.id,'login');
    const [keys]=await getOrderPool().execute("SELECT k.* FROM adminPasskeys k JOIN users u ON u.id=k.userId WHERE k.id=? AND k.userId=? AND u.role='admin'",[String(input.response?.id||''),ch.userId]);
    const key=keys[0]; if(!key) throw new Error('Llave no reconocida');
    const {rpID,origin}=relyingParty();
    const verification=await verifyAuthenticationResponse({response:input.response,expectedChallenge:ch.challenge,expectedOrigin:origin,expectedRPID:rpID,requireUserVerification:true,credential:{id:key.id,publicKey:new Uint8Array(key.publicKey),counter:Number(key.counter),transports:parse(key.transports)||[]}});
    if(!verification.verified) throw new Error('Llave no verificada');
    const [updated]=await getOrderPool().execute('UPDATE adminPasskeys SET counter=? WHERE id=? AND counter=?',[verification.authenticationInfo.newCounter,key.id,key.counter]);
    if(updated.affectedRows!==1) throw new Error('Llave en uso; vuelve a intentarlo');
    await issueSession(ctx,Number(key.userId)); return {success:true};
  }),
});
