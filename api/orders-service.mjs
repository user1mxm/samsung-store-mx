import { toCents, fromCents } from './payments/money.mjs';

export class OrderError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

export function validateItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 50) throw new OrderError('BAD_REQUEST', 'Invalid order items');
  const seen = new Set();
  return items.map(item => {
    if (!Number.isSafeInteger(item.productId) || item.productId < 1 || seen.has(item.productId)
        || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
      throw new OrderError('BAD_REQUEST', 'Invalid or duplicate order item');
    }
    seen.add(item.productId);
    return { productId: item.productId, quantity: item.quantity };
  }).sort((a, b) => a.productId - b.productId);
}

export async function insertReservedOrder(connection, userId, input) {
  const items = validateItems(input.items);
  const lines = [];
  let totalCents = 0;
  // Lock in a stable order to avoid cross-cart deadlocks.
  for (const item of items) {
    const [rows] = await connection.execute('SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE', [item.productId]);
    const product = rows[0];
    if (!product) throw new OrderError('NOT_FOUND', 'Product no longer available');
    if (product.stock < item.quantity) throw new OrderError('CONFLICT', 'Insufficient stock');
    const unitCents = toCents(product.price);
    totalCents += unitCents * item.quantity;
    if (totalCents > 9999999999) throw new OrderError('BAD_REQUEST', 'Order total exceeds supported amount');
    lines.push({ ...item, name: product.name, price: fromCents(unitCents) });
  }
  if (totalCents <= 0) throw new OrderError('BAD_REQUEST', 'Order must have a positive total');
  const total = fromCents(totalCents);
  const [result] = await connection.execute(
    "INSERT INTO orders (userId, total, status, shippingAddress, inventoryReserved) VALUES (?, ?, 'pending', ?, 1)",
    [userId, total, input.shippingAddress ? JSON.stringify(input.shippingAddress) : null],
  );
  const orderId = Number(result.insertId);
  for (const line of lines) {
    const [reserved] = await connection.execute('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?', [line.quantity, line.productId, line.quantity]);
    if (reserved.affectedRows !== 1) throw new OrderError('CONFLICT', 'Insufficient stock');
    await connection.execute('INSERT INTO orderItems (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)', [orderId, line.productId, line.quantity, line.price]);
  }
  return { success: true, orderId, total, status: 'pending', items: lines };
}

export async function createPendingOrder(pool, userId, input) {
  if (!Number.isSafeInteger(userId) || userId < 1) throw new OrderError('UNAUTHORIZED', 'Sign in required');
  validateItems(input.items);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await insertReservedOrder(connection, userId, input);
    await connection.commit();
    // A pending order is not proof of payment.
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

const transitions = { pending: ['processing', 'cancelled'], processing: ['shipped'], shipped: ['delivered'], delivered: [], cancelled: [] };

export async function transitionOrder(pool, orderId, nextStatus) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.execute('SELECT status, inventoryReserved FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (!orders[0]) throw new OrderError('NOT_FOUND', 'Order not found');
    const current = orders[0].status;
    if (current !== nextStatus) {
      if (!transitions[current]?.includes(nextStatus)) throw new OrderError('CONFLICT', 'Invalid order status transition');
      if (nextStatus === 'cancelled' && orders[0].inventoryReserved === 1) {
        const [attempts] = await connection.execute('SELECT state FROM paymentAttempts WHERE orderId = ? LIMIT 1', [orderId]);
        if (attempts.length) throw new OrderError('CONFLICT', 'Cancel or reconcile the provider checkout before restoring inventory');
        const [items] = await connection.execute('SELECT productId, quantity FROM orderItems WHERE orderId = ? ORDER BY productId', [orderId]);
        for (const item of items) await connection.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.productId]);
        await connection.execute('UPDATE orders SET inventoryReserved = 0 WHERE id = ?', [orderId]);
      }
      await connection.execute('UPDATE orders SET status = ? WHERE id = ?', [nextStatus, orderId]);
    }
    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}
