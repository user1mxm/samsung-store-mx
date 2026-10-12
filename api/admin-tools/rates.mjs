import { z } from 'zod';
import { createHash } from 'node:crypto';
import { transaction,audit,json } from '../commerce/core.mjs';
import { toCents,fromCents } from '../payments/money.mjs';

export const rateValue=z.number().min(0).max(25).refine(n=>Math.abs(n*100-Math.round(n*100))<1e-8,'Usa como máximo dos decimales');
export const rateChange=z.object({
  kind:z.enum(['agent','network']), userId:z.number().int().positive(),
  memberId:z.number().int().positive().optional(),
  rate:rateValue, expectedVersion:z.string(), reason:z.string().trim().min(3).max(255),
}).strict();
const version=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function commissionEstimate(amount,rate) { rateValue.parse(rate); return fromCents(Number((BigInt(toCents(amount))*BigInt(Math.round(rate*100))+5000n)/10000n)); }
export async function listRates(c) {
  const [agents]=await c.query('SELECT a.id,a.userId,a.code,a.commission,u.name FROM agents a JOIN users u ON u.id=a.userId ORDER BY u.name');
  const [links]=await c.query('SELECT r.userId AS memberId,r.referrerId AS userId,u.name AS memberName,p.name AS name FROM referrals r JOIN users u ON u.id=r.userId JOIN users p ON p.id=r.referrerId ORDER BY p.name,u.name');
  const [settings]=await c.query("SELECT name,body FROM storeSettings WHERE name LIKE 'agentRate:%'");
  const map=Object.fromEntries(settings.map(s=>[s.name,json(s.body)]));
  const [custom]=await c.query('SELECT ambassadorId,subAgentId,rate,notes FROM ambassador_commissions');
  return {automaticSettlement:false,agents:agents.map(a=>{
    const saved=map[`agentRate:${a.userId}`]??null;
    return {...a,rate:saved?.rate??null,version:version(saved),reason:saved?.reason??'',example:saved?commissionEstimate('1000',saved.rate):null};
  }),network:links.map(link=>{
    const saved=custom.find(r=>Number(r.ambassadorId)===Number(link.userId)&&Number(r.subAgentId)===Number(link.memberId));
    const value=saved?{rate:Number(saved.rate),notes:saved.notes??''}:null;
    return {...link,rate:value?.rate??8,custom:!!value,version:version(value),reason:value?.notes??'',example:commissionEstimate('1000',value?.rate??8)};
  })};
}
export async function saveRate(pool,actorId,input) {
  const value=rateChange.parse(input);
  return transaction(pool,async c=>{
    // One short settings lock covers both tables and prevents lost updates.
    await c.execute("INSERT IGNORE INTO storeSettings (name,body) VALUES ('rateWriteLock','{}')");
    await c.execute("SELECT name FROM storeSettings WHERE name='rateWriteLock' FOR UPDATE");
    let before,after;
    if(value.kind==='agent') {
      const [agents]=await c.execute("SELECT a.userId FROM agents a JOIN users u ON u.id=a.userId WHERE a.userId=? AND u.role='agent' FOR UPDATE",[value.userId]);
      if(!agents.length) throw Error('Agente no encontrado o sin rol de agente');
      const key=`agentRate:${value.userId}`;
      const [rows]=await c.execute('SELECT body FROM storeSettings WHERE name=? FOR UPDATE',[key]);before=rows[0]?json(rows[0].body):null;
      if(version(before)!==value.expectedVersion) throw Error('La tasa cambió. Recarga y revisa antes de guardar.');
      after={rate:value.rate,reason:value.reason,updatedBy:actorId,updatedAt:new Date().toISOString()};
      await c.execute('INSERT INTO storeSettings (name,body) VALUES (?,?) ON DUPLICATE KEY UPDATE body=VALUES(body)',[key,JSON.stringify(after)]);
    } else {
      if(!value.memberId || value.memberId===value.userId) throw Error('Selecciona un vínculo válido');
      const [links]=await c.execute('SELECT userId FROM referrals WHERE userId=? AND referrerId=? FOR UPDATE',[value.memberId,value.userId]);
      if(!links.length) throw Error('El miembro ya no pertenece directamente a este referente');
      const [rows]=await c.execute('SELECT rate,notes FROM ambassador_commissions WHERE ambassadorId=? AND subAgentId=? FOR UPDATE',[value.userId,value.memberId]);
      before=rows[0]?{rate:Number(rows[0].rate),notes:rows[0].notes??''}:null;
      if(version(before)!==value.expectedVersion) throw Error('La tasa cambió. Recarga y revisa antes de guardar.');
      after={rate:value.rate,notes:value.reason};
      await c.execute('INSERT INTO ambassador_commissions (ambassadorId,subAgentId,rate,notes) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE rate=VALUES(rate),notes=VALUES(notes)',[value.userId,value.memberId,value.rate,value.reason]);
    }
    await audit(c,actorId,'commission.rate',value.userId,{kind:value.kind,memberId:value.memberId??null,beneficiaryId:value.userId,before,after});
    return {success:true,example:commissionEstimate('1000',value.rate),automaticSettlement:false};
  });
}
