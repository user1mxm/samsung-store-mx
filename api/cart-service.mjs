import { OrderError } from './orders-service.mjs';

export async function changeCart(pool, userId, productId, quantity, mode = 'set') {
  if (!Number.isSafeInteger(userId) || userId < 1) throw new OrderError('UNAUTHORIZED', 'Sign in required');
  if (!Number.isSafeInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 0 || quantity > 999 || !['set', 'add'].includes(mode)) throw new OrderError('BAD_REQUEST', 'Invalid cart quantity');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // A product lock serializes concurrent cart edits without needing a new index.
    const [products] = await connection.execute('SELECT stock FROM products WHERE id = ? FOR UPDATE', [productId]);
    if (!products.length && quantity) throw new OrderError('NOT_FOUND', 'Product no longer available');
    const [rows] = await connection.execute('SELECT id, quantity FROM cartItems WHERE userId = ? AND productId = ? ORDER BY id FOR UPDATE', [userId, productId]);
    const total = mode === 'add' ? rows.reduce((sum, row) => sum + Number(row.quantity), 0) + quantity : quantity;
    if (!Number.isSafeInteger(total) || total < 0 || total > 999 || (total && total > Number(products[0]?.stock ?? 0))) throw new OrderError('BAD_REQUEST', 'Insufficient stock');
    await connection.execute('DELETE FROM cartItems WHERE userId = ? AND productId = ?', [userId, productId]);
    if (total) await connection.execute('INSERT INTO cartItems (userId, productId, quantity) VALUES (?, ?, ?)', [userId, productId, total]);
    await connection.commit();
    return { success: true, quantity: total };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}
