import { randomUUID } from 'node:crypto';
import { transaction,audit } from './core.mjs';
import { toCents } from '../payments/money.mjs';
export async function providerRefund(refund,config,fetcher=fetch) {
  const stripe=refund.provider==='stripe';
  if(stripe?!/^pi_[a-zA-Z0-9]+$/.test(refund.paymentId):!/^\d+$/.test(refund.paymentId))throw new Error('Identificador de pago inválido');
  if(stripe?!config.secretKey:!config.accessToken)throw new Error('Proveedor sin credenciales');
  if(!stripe){const paymentResponse=await fetcher(`https://api.mercadopago.com/v1/payments/${refund.paymentId}`,{headers:{Authorization:`Bearer ${config.accessToken}`},signal:AbortSignal.timeout(15000)});if(!paymentResponse.ok)throw new Error('No se pudo verificar el pago');const payment=await paymentResponse.json();if(payment.currency_id!=='MXN'||payment.status!=='approved'||toCents(payment.transaction_amount)!==refund.amountCents||Number(payment.transaction_amount_refunded||0)!==0)throw new Error('Pago inconsistente o ya reembolsado');}
  const body=stripe?new URLSearchParams({payment_intent:refund.paymentId,amount:String(refund.amountCents),reason:'requested_by_customer','metadata[store_refund_id]':refund.id}):JSON.stringify({amount:refund.amountCents/100});
  const headers=stripe?{Authorization:`Bearer ${config.secretKey}`,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':`refund-${refund.id}`}:{Authorization:`Bearer ${config.accessToken}`,'Content-Type':'application/json','X-Idempotency-Key':refund.id};
  const url=stripe?'https://api.stripe.com/v1/refunds':`https://api.mercadopago.com/v1/payments/${refund.paymentId}/refunds`;
  const res=await fetcher(url,{method:'POST',headers,body,signal:AbortSignal.timeout(15000)});
  if(!res.ok)throw new Error('Reembolso requiere conciliación');
  const r=await res.json();
  if(!r.id || (stripe?(r.payment_intent!==refund.paymentId || r.currency!=='mxn' || r.amount!==refund.amountCents):(String(r.payment_id)!==refund.paymentId || toCents(r.amount)!==refund.amountCents)))throw new Error('Respuesta de reembolso inconsistente');
  return {id:String(r.id),state:(stripe?r.status==='succeeded':r.status==='approved')?'confirmed':'review'};
}
export async function requestRefund(pool,actorId,orderId,reason,config,fetcher=fetch) {
  if(!config)throw new Error('Proveedor sin configuración');
  const refund=await transaction(pool,async c=>{
    const [orders]=await c.execute('SELECT * FROM orders WHERE id=? FOR UPDATE',[orderId]);const order=orders[0];if(!order)throw new Error('Pedido no encontrado');
    const [prior]=await c.execute('SELECT * FROM paymentRefunds WHERE orderId=?',[orderId]);if(prior[0])return {...prior[0],existing:true};
    const [payments]=await c.execute("SELECT * FROM paymentAttempts WHERE orderId=? AND state='paid'",[orderId]);const p=payments[0];if(!p?.settlementId)throw new Error('Pedido sin pago confirmado');
    const refund={id:randomUUID(),orderId,actorId,provider:p.provider,paymentId:p.settlementId,amountCents:toCents(order.total),reason};
    await c.execute('INSERT INTO paymentRefunds (id,orderId,actorId,provider,paymentId,amountCents,reason) VALUES (?,?,?,?,?,?,?)',Object.values(refund));await audit(c,actorId,'payment.refund.request',orderId);return refund;
  });
  if(refund.existing)return {id:refund.id,state:refund.state};
  let remote;try{remote=await providerRefund(refund,config,fetcher);}catch{await pool.execute("UPDATE paymentRefunds SET state='review' WHERE id=?",[refund.id]);throw new Error('Resultado pendiente de conciliación. No repitas el reembolso.');}
  await pool.execute('UPDATE paymentRefunds SET providerRefundId=?,state=? WHERE id=?',[remote.id,remote.state==='confirmed'?'received':'review',refund.id]);
  if(remote.state==='confirmed')await finalizeRefund(pool,refund.id);
  return {id:refund.id,state:remote.state};
}
export async function finalizeRefund(pool,id) {
  return transaction(pool,async c=>{
    const [refunds]=await c.execute('SELECT * FROM paymentRefunds WHERE id=? FOR UPDATE',[id]);const r=refunds[0];if(!r||r.state==='confirmed')return;if(r.state!=='received')throw new Error('Reembolso no confirmado por proveedor');
    const [orders]=await c.execute('SELECT * FROM orders WHERE id=? FOR UPDATE',[r.orderId]);const order=orders[0];
    // Shipped goods need an actual return inspection before inventory can be restored.
    if(order.inventoryReserved===1 && ['pending','processing'].includes(order.status)){const [items]=await c.execute('SELECT productId,quantity FROM orderItems WHERE orderId=? ORDER BY productId',[order.id]);for(const i of items)await c.execute('UPDATE products SET stock=stock+? WHERE id=?',[i.quantity,i.productId]);await c.execute('UPDATE orders SET inventoryReserved=0 WHERE id=?',[order.id]);}
    await c.execute("UPDATE orders SET status='cancelled' WHERE id=?",[order.id]);await c.execute("UPDATE serviceBookings SET status='cancelled' WHERE orderId=? AND status<>'completed'",[order.id]);
    await c.execute('SELECT id FROM users WHERE id=? FOR UPDATE',[order.userId]);
    const [credit]=await c.execute('SELECT points FROM rewardLedger WHERE eventKey=?',[`order:${order.id}`]);if(credit[0])await c.execute('INSERT IGNORE INTO rewardLedger (userId,eventKey,points,reason) VALUES (?,?,?,?)',[order.userId,`refund:${order.id}`,-Number(credit[0].points),`Reembolso pedido #${order.id}`]);
    await c.execute("UPDATE paymentRefunds SET state='confirmed' WHERE id=?",[id]);await audit(c,r.actorId,'payment.refund.confirmed',order.id);
  });
}
export async function reconcileRefund(pool,id,config,fetcher=fetch) {
  const [rows]=await pool.execute('SELECT * FROM paymentRefunds WHERE id=?',[id]);const r=rows[0];if(!r)throw new Error('Reembolso no encontrado');if(r.state==='confirmed')return {state:r.state};
  const stripe=r.provider==='stripe'; const key=stripe?config.secretKey:config.accessToken;
  // GET only: ambiguous requests never issue another refund POST.
  const url=stripe?`https://api.stripe.com/v1/refunds?payment_intent=${encodeURIComponent(r.paymentId)}&limit=100`:`https://api.mercadopago.com/v1/payments/${r.paymentId}/refunds`;
  if(!stripe){const paymentResponse=await fetcher(`https://api.mercadopago.com/v1/payments/${r.paymentId}`,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(15000)});if(!paymentResponse.ok)throw new Error('Proveedor no disponible');const payment=await paymentResponse.json();if(payment.currency_id!=='MXN'||toCents(payment.transaction_amount)!==Number(r.amountCents))throw new Error('Pago inconsistente');}
  const response=await fetcher(url,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('Proveedor no disponible');const body=await response.json();const list=stripe?body.data:body;
  const match=Array.isArray(list)?list.find(x=>stripe?x.status==='succeeded'&&x.metadata?.store_refund_id===r.id&&x.payment_intent===r.paymentId&&x.currency==='mxn'&&x.amount===Number(r.amountCents):x.status==='approved'&&String(x.payment_id)===r.paymentId&&toCents(x.amount)===Number(r.amountCents)):null;
  if(!match) return {state:'review'};
  await pool.execute("UPDATE paymentRefunds SET state='received',providerRefundId=? WHERE id=?",[String(match.id),id]);await finalizeRefund(pool,id);return {state:'confirmed'};
}
