import { reserveService, digest, json } from '../commerce/core.mjs';
import { toCents, fromCents } from './money.mjs';
import { createHash, randomUUID } from 'node:crypto';
import { insertReservedOrder, validateItems, OrderError } from '../orders-service.mjs';
import { createStripeCheckout, createMercadoPagoCheckout, isSettledPayment } from './providers.mjs';

function inputHash(input) {
  const shipping = Object.fromEntries(Object.entries(input.shippingAddress).sort(([a], [b]) => a.localeCompare(b)));
  return createHash('sha256').update(JSON.stringify({ items: validateItems(input.items), shipping, provider: input.provider, service: input.service || null, quoteToken: input.quoteToken || null })).digest('hex');
}

function publicAttempt(row) {
  return { reference: row.id, orderId: Number(row.orderId), state: row.state, url: row.checkoutUrl };
}

async function reuse(pool, userId, key, hash) {
  const [rows] = await pool.execute('SELECT * FROM paymentAttempts WHERE userId = ? AND requestKey = ?', [userId, key]);
  const row = rows[0];
  if (!row) throw new OrderError('CONFLICT', 'Checkout is being created; retry with the same request key');
  if (row.inputHash !== hash) throw new OrderError('CONFLICT', 'Checkout key already belongs to a different cart or provider');
  if (row.state === 'pending' || row.state === 'paid' || row.state === 'cancelled') return publicAttempt(row);
  throw new OrderError('CONFLICT', 'Checkout outcome requires reconciliation; do not create another payment');
}

export async function startCheckout(pool, userId, input, config, clients = {}) {
  if (!Number.isSafeInteger(userId) || userId < 1) throw new OrderError('UNAUTHORIZED', 'Sign in required');
  const hash = inputHash(input);
  const reference = randomUUID();
  const connection = await pool.getConnection();
  let snapshot;
  let order;
  try {
    await connection.beginTransaction();
    // Unique insertion serializes the same logical checkout before reserving stock.
    await connection.execute('INSERT INTO paymentAttempts (id, userId, requestKey, inputHash, provider) VALUES (?, ?, ?, ?, ?)', [reference, userId, input.requestKey, hash, input.provider]);
    let quoted;
    if (input.quoteToken) {
      const [quotes] = await connection.execute("SELECT * FROM storeQuotes WHERE tokenHash=? AND userId=? AND status='open' AND expiresAt>NOW() FOR UPDATE",[digest(input.quoteToken),userId]);
      if (!quotes[0]) throw new OrderError('CONFLICT','Cotización vencida o no disponible');
      quoted = json(quotes[0].snapshot);
      if (JSON.stringify(validateItems(quoted.items)) !== JSON.stringify(validateItems(input.items))) throw new OrderError('CONFLICT','La cotización no corresponde a este carrito');
    }
    order = await insertReservedOrder(connection, userId, {...input, quoted});
    if (input.quoteToken) await connection.execute("UPDATE storeQuotes SET status='converted',orderId=? WHERE tokenHash=?",[order.orderId,digest(input.quoteToken)]);
    if (input.service) {
      const line = await reserveService(connection,userId,order.orderId,input.service,input.shippingAddress.postalCode);
      const cents = toCents(order.total)+toCents(line.price);
      order.total=fromCents(cents);
      if (toCents(line.price)>0) order.items.push({...line,productId:'delivery'});
      await connection.execute('UPDATE orders SET total=? WHERE id=?',[order.total,order.orderId]);
    }
    snapshot = { reference, total: order.total, items: order.items };
    await connection.execute('UPDATE paymentAttempts SET orderId = ?, snapshot = ? WHERE id = ?', [order.orderId, JSON.stringify(snapshot), reference]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return reuse(pool, userId, input.requestKey, hash);
    throw error;
  } finally { connection.release(); }

  try {
    const create = input.provider === 'stripe' ? (clients.stripe ?? createStripeCheckout) : (clients.mercadopago ?? createMercadoPagoCheckout);
    const session = await create(snapshot, config);
    await pool.execute("UPDATE paymentAttempts SET sessionId = ?, checkoutUrl = ?, state = 'pending' WHERE id = ? AND state = 'creating'", [session.sessionId, session.url, reference]);
    return { reference, orderId: order.orderId, state: 'pending', url: session.url };
  } catch {
    // The provider may have created the session even if we lost its response.
    await pool.execute("UPDATE paymentAttempts SET state = 'review' WHERE id = ? AND state = 'creating'", [reference]);
    throw new OrderError('CONFLICT', 'Checkout outcome requires reconciliation; no automatic payment retry');
  }
}

export async function checkoutStatus(pool, userId, reference) {
  const [rows] = reference
    ? await pool.execute('SELECT id, orderId, state, checkoutUrl FROM paymentAttempts WHERE id = ? AND userId = ?', [reference, userId])
    : await pool.execute("SELECT id, orderId, state, checkoutUrl FROM paymentAttempts WHERE userId = ? AND state <> 'paid' ORDER BY createdAt DESC LIMIT 1", [userId]);
  if (!rows[0]) {
    if (reference) throw new OrderError('NOT_FOUND', 'Checkout not found');
    return null;
  }
  return { reference: rows[0].id, orderId: Number(rows[0].orderId), state: rows[0].state, url: rows[0].state === 'pending' ? rows[0].checkoutUrl : null };
}

export async function settleCheckout(pool, provider, eventId, payment) {
  const reference = provider === 'stripe' ? payment.client_reference_id : payment.external_reference;
  if (!/^[a-f0-9-]{36}$/i.test(reference ?? '')) throw new OrderError('BAD_REQUEST', 'Invalid checkout reference');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT * FROM paymentAttempts WHERE id = ? FOR UPDATE', [reference]);
    const attempt = rows[0];
    if (!attempt || attempt.provider !== provider) throw new OrderError('NOT_FOUND', 'Checkout not found');
    if (!attempt.sessionId) throw new OrderError('CONFLICT', 'Session persistence incomplete; retry notification');
    const snapshot = typeof attempt.snapshot === 'string' ? JSON.parse(attempt.snapshot) : attempt.snapshot;
    if (!isSettledPayment(provider, payment, { ...snapshot, sessionId: attempt.sessionId })) throw new OrderError('BAD_REQUEST', 'Settlement does not match checkout');
    const settlementId = String(provider === 'stripe' ? payment.payment_intent : payment.id);
    if (!settlementId || settlementId === 'undefined') throw new OrderError('BAD_REQUEST', 'Payment ID missing');
    const [events] = await connection.execute('SELECT attemptId FROM paymentEvents WHERE provider = ? AND eventId = ?', [provider, eventId]);
    if (events.length) {
      if (events[0].attemptId !== reference) throw new OrderError('CONFLICT', 'Event belongs to another checkout');
      await connection.commit(); return { duplicate: true };
    }
    if (attempt.state === 'paid' && attempt.settlementId !== settlementId) throw new OrderError('CONFLICT', 'Different payment for an already paid order requires review');
    const [orders] = await connection.execute('SELECT status FROM orders WHERE id = ? FOR UPDATE', [attempt.orderId]);
    if (!orders[0] || orders[0].status === 'cancelled') throw new OrderError('CONFLICT', 'Payment for cancelled order requires review');
    await connection.execute('INSERT INTO paymentEvents (provider, eventId, attemptId) VALUES (?, ?, ?)', [provider, eventId, reference]);
    if (attempt.state !== 'paid') {
      await connection.execute("UPDATE paymentAttempts SET state = 'paid', settlementId = ? WHERE id = ?", [settlementId, reference]);
      await connection.execute("UPDATE orders SET status = 'processing' WHERE id = ? AND status = 'pending'", [attempt.orderId]);
    }
    await connection.commit();
    return { duplicate: attempt.state === 'paid' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}
