import {transaction,audit} from './core.mjs';
export async function cancelStripeCheckout(pool,user,orderId,config,fetcher=fetch){
 if(!config?.secretKey)throw new Error('Stripe sin configuración');const [rows]=await pool.execute('SELECT p.*,o.userId AS owner FROM paymentAttempts p JOIN orders o ON o.id=p.orderId WHERE p.orderId=?',[orderId]);const p=rows[0];
 if(!p||p.provider!=='stripe'||(user.role!=='admin'&&Number(p.owner)!==user.id)||!/^cs_[a-zA-Z0-9_]+$/.test(p.sessionId||'')||p.state==='paid')throw new Error('Checkout no cancelable');
 const base=`https://api.stripe.com/v1/checkout/sessions/${p.sessionId}`,headers={Authorization:`Bearer ${config.secretKey}`};
 // A failed expiry request never releases inventory; authoritative GET must prove expiry/unpaid.
 try{await fetcher(base+'/expire',{method:'POST',headers:{...headers,'Idempotency-Key':`cancel-${p.id}`},signal:AbortSignal.timeout(15000)});}catch{}
 const res=await fetcher(base,{headers,signal:AbortSignal.timeout(15000)});if(!res.ok)throw new Error('Consulta Stripe antes de cancelar');const session=await res.json();
 if(session.id!==p.sessionId||session.client_reference_id!==p.id||session.status!=='expired'||session.payment_status!=='unpaid'||session.payment_intent)throw new Error('El proveedor no confirma checkout vencido sin pago');
 return transaction(pool,async c=>{
  const [payments]=await c.execute('SELECT state,settlementId FROM paymentAttempts WHERE id=? FOR UPDATE',[p.id]);if(payments[0]?.state==='paid'||payments[0]?.settlementId)throw new Error('Pago confirmado; usa reembolso');
  const [orders]=await c.execute('SELECT status,inventoryReserved FROM orders WHERE id=? FOR UPDATE',[orderId]);if(!['pending','cancelled'].includes(orders[0]?.status))throw new Error('Pedido no cancelable');
  if(orders[0].inventoryReserved===1){const [items]=await c.execute('SELECT productId,quantity FROM orderItems WHERE orderId=? ORDER BY productId',[orderId]);for(const i of items)await c.execute('UPDATE products SET stock=stock+? WHERE id=?',[i.quantity,i.productId]);await c.execute('UPDATE orders SET inventoryReserved=0 WHERE id=?',[orderId]);}
  await c.execute("UPDATE orders SET status='cancelled' WHERE id=?",[orderId]);await c.execute("UPDATE paymentAttempts SET state='cancelled',checkoutUrl=NULL WHERE id=?",[p.id]);await c.execute("UPDATE serviceBookings SET status='cancelled' WHERE orderId=?",[orderId]);await audit(c,user.id,'checkout.stripe.cancel',orderId);return {success:true};
 });
}
