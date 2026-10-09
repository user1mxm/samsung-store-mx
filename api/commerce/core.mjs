import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { validateItems } from '../orders-service.mjs';
import { toCents, fromCents } from '../payments/money.mjs';
export const json = value => typeof value === 'string' ? JSON.parse(value) : value;
export const digest = value => createHash('sha256').update(value).digest('hex');
export async function transaction(pool, fn) { const c=await pool.getConnection(); try { await c.beginTransaction(); const value=await fn(c); await c.commit(); return value; } catch(e) { await c.rollback(); throw e; } finally { c.release(); } }
export async function audit(c, actorId, action, resourceId, details={}) { await c.execute('INSERT INTO storeAudit (actorId,action,resourceId,details) VALUES (?,?,?,?)',[actorId,action,String(resourceId||''),JSON.stringify(details)]); }
export async function ownedOrder(c,user,id,lock=false) { const [rows]=await c.execute(`SELECT * FROM orders WHERE id=? ${lock?'FOR UPDATE':''}`,[id]); const order=rows[0]; if(!order || (user.role!=='admin'&&Number(order.userId)!==user.id)) throw new Error('Pedido no disponible'); return order; }
export async function snapshotCart(c, items) {
  const lines=[]; let totalCents=0;
  for(const item of validateItems(items)) {
    const [rows]=await c.execute('SELECT id,name,model,price,stock,imageUrl FROM products WHERE id=? FOR UPDATE',[item.productId]); const p=rows[0];
    if(!p || p.stock<item.quantity) throw new Error('Producto sin disponibilidad');
    const cents=toCents(p.price); totalCents+=cents*item.quantity;
    if(totalCents>9999999999) throw new Error('Importe fuera de rango');
    lines.push({...item,name:p.name,model:p.model,price:fromCents(cents),image:p.imageUrl});
  }
  return {items:lines,total:fromCents(totalCents)};
}
export async function createQuote(pool,userId,items) {
  return transaction(pool,async c=>{
    const snapshot=await snapshotCart(c,items); const id=randomUUID(),token=randomBytes(32).toString('hex');
    await c.execute('INSERT INTO storeQuotes (id,userId,tokenHash,snapshot,expiresAt) VALUES (?,?,?,?,DATE_ADD(NOW(), INTERVAL 48 HOUR))',[id,userId,digest(token),JSON.stringify(snapshot)]);
    return {id,token,snapshot,expiresAt:new Date(Date.now()+48*3600000).toISOString()};
  });
}
export async function publicQuote(pool,token) { const [rows]=await pool.execute('SELECT id,snapshot,expiresAt,status FROM storeQuotes WHERE tokenHash=?',[digest(token)]); const q=rows[0]; if(!q) throw new Error('Cotización no encontrada'); return {...q,snapshot:json(q.snapshot),expired:new Date(q.expiresAt).getTime()<=Date.now()}; }
export function rewardPoints(total,rate) { if(!Number.isInteger(rate)||rate<0||rate>1000) throw new Error('Regla de puntos inválida'); return Math.floor(toCents(total)/10000)*rate; }
export async function awardRewards(c,orderId) {
  const [rows]=await c.execute("SELECT o.userId,o.total FROM orders o JOIN paymentAttempts p ON p.orderId=o.id AND p.state='paid' WHERE o.id=? AND o.status='delivered'",[orderId]);
  const [settings]=await c.execute("SELECT body FROM storeSettings WHERE name='rewards'"); const rule=json(settings[0]?.body||{});
  if(!rows[0] || !rule.enabled) return;
  const points=rewardPoints(rows[0].total,rule.pointsPer100);
  if(points) await c.execute("INSERT IGNORE INTO rewardLedger (userId,eventKey,points,reason) VALUES (?,?,?,?)",[rows[0].userId,`order:${orderId}`,points,`Pedido entregado #${orderId}`]);
}
export async function redeem(pool,userId,benefitId) {
  return transaction(pool,async c=>{
    await c.execute('SELECT id FROM users WHERE id=? FOR UPDATE',[userId]);
    const [benefits]=await c.execute('SELECT * FROM rewardBenefits WHERE id=? AND active=1 FOR UPDATE',[benefitId]); const benefit=benefits[0]; if(!benefit) throw new Error('Beneficio no disponible');
    const [balance]=await c.execute('SELECT COALESCE(SUM(points),0) AS points FROM rewardLedger WHERE userId=?',[userId]);
    if(Number(balance[0].points)<benefit.points) throw new Error('Puntos insuficientes');
    const id=randomUUID(); await c.execute('INSERT INTO rewardRedemptions (id,userId,benefitId,snapshot) VALUES (?,?,?,?)',[id,userId,benefitId,JSON.stringify(benefit)]);
    await c.execute('INSERT INTO rewardLedger (userId,eventKey,points,reason) VALUES (?,?,?,?)',[userId,`redeem:${id}`,-benefit.points,benefit.name]); return {id,benefit};
  });
}
export function serviceDates(zone,now=new Date()) { return Array.from({length:14},(_,i)=>new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+Number(zone.daysAhead)+i)).toISOString().slice(0,10)); }
export async function serviceAvailability(pool,postalCode) {
  const [zones]=await pool.execute('SELECT * FROM serviceZones WHERE postalCode=? AND active=1',[postalCode]); const zone=zones[0]; if(!zone) return null;
  const dates=serviceDates(zone); const [booked]=await pool.execute("SELECT serviceDate,COUNT(*) AS used FROM serviceBookings WHERE zoneId=? AND status<>'cancelled' AND serviceDate BETWEEN ? AND ? GROUP BY serviceDate",[zone.id,dates[0],dates.at(-1)]);
  return {...zone,dates:dates.map(date=>({date,available:Math.max(0,zone.dailyCapacity-Number(booked.find(b=>new Date(b.serviceDate).toISOString().slice(0,10)===date)?.used||0))}))};
}
export async function reserveService(c,userId,orderId,selection,shippingPostalCode) {
  const [zones]=await c.execute('SELECT * FROM serviceZones WHERE id=? AND active=1 FOR UPDATE',[selection.zoneId]); const zone=zones[0];
  if(!zone || zone.postalCode!==shippingPostalCode || !serviceDates(zone).includes(selection.date)) throw new Error('Entrega no disponible para este domicilio');
  const [rows]=await c.execute("SELECT COUNT(*) AS used FROM serviceBookings WHERE zoneId=? AND serviceDate=? AND status<>'cancelled'",[zone.id,selection.date]);
  if(Number(rows[0].used)>=zone.dailyCapacity) throw new Error('Horario agotado');
  const cents=Number(zone.deliveryCents)+(selection.installation?Number(zone.installationCents):0);
  await c.execute('INSERT INTO serviceBookings (id,userId,orderId,zoneId,serviceDate,installation,snapshot) VALUES (?,?,?,?,?,?,?)',[randomUUID(),userId,orderId,zone.id,selection.date,selection.installation,JSON.stringify({label:zone.label,postalCode:zone.postalCode,cents})]);
  return {name:`Entrega${selection.installation?' e instalación':''} · ${selection.date}`,price:fromCents(cents),quantity:1};
}
