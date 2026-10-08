import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPendingOrder, transitionOrder } from '../api/orders-service.mjs';
import { startCheckout, checkoutStatus, settleCheckout } from '../api/payments/checkout-service.mjs';
import { randomUUID } from 'node:crypto';

const databaseUrl = process.env.MYSQL_TEST_URL;

test('MySQL atomic orders and inventory', { skip: !databaseUrl }, async t => {
  // This suite destroys fixture rows; refuse any database outside a dedicated test schema.
  const url = new URL(databaseUrl);
  assert.match(url.pathname, /^\/samsung_store_test$/);
  const { createPool } = await import('mysql2/promise');
  const pool = createPool(databaseUrl);
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS products (id BIGINT UNSIGNED PRIMARY KEY, name VARCHAR(255) NOT NULL, price DECIMAL(10,2) NOT NULL, stock INT NOT NULL) ENGINE=InnoDB');
    await pool.query("CREATE TABLE IF NOT EXISTS orders (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, userId BIGINT UNSIGNED NOT NULL, total DECIMAL(10,2) NOT NULL, status VARCHAR(30) NOT NULL, shippingAddress TEXT) ENGINE=InnoDB");
    const [columns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'inventoryReserved'");
    if (!columns.length) await pool.query(await readFile(new URL('../db/migrations/20261008_order_inventory.sql', import.meta.url), 'utf8'));
    const [tables] = await pool.query("SHOW TABLES LIKE 'paymentAttempts'");
    if (!tables.length) {
      const sql = await readFile(new URL('../db/migrations/20261008_payment_attempts.sql', import.meta.url), 'utf8');
      for (const statement of sql.split(';').filter(part => part.trim())) await pool.query(statement);
    }
    await pool.query('CREATE TABLE IF NOT EXISTS orderItems (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, orderId BIGINT UNSIGNED NOT NULL, productId BIGINT UNSIGNED NOT NULL, quantity INT NOT NULL, price DECIMAL(10,2) NOT NULL) ENGINE=InnoDB');
    async function reset(stock = 1, price = '13400.00') {
      await pool.query('DELETE FROM paymentEvents'); await pool.query('DELETE FROM paymentAttempts');
      await pool.query('DELETE FROM orderItems'); await pool.query('DELETE FROM orders'); await pool.query('DELETE FROM products');
      await pool.execute('INSERT INTO products VALUES (1, ?, ?, ?)', ['TV', price, stock]);
    }
    const input = { total: '0.01', items: [{ productId: 1, quantity: 1, price: '0.01' }] };

    await t.test('browser prices and totals cannot underpay', async () => {
      await reset(); const result = await createPendingOrder(pool, 1, input);
      assert.equal(result.total, '13400.00'); assert.equal(result.status, 'pending');
      const [items] = await pool.query('SELECT price FROM orderItems'); assert.equal(items[0].price, '13400.00');
    });

    await t.test('two buyers cannot reserve the last item', async () => {
      await reset(); const results = await Promise.allSettled([createPendingOrder(pool, 1, input), createPendingOrder(pool, 2, input)]);
      assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
      const [stock] = await pool.query('SELECT stock FROM products'); assert.equal(stock[0].stock, 0);
      const [orders] = await pool.query('SELECT COUNT(*) AS count FROM orders'); assert.equal(orders[0].count, 1);
    });

    await t.test('missing product leaves no order or partial reservation', async () => {
      await reset(); await assert.rejects(createPendingOrder(pool, 1, { items: [{ productId: 1, quantity: 1 }, { productId: 2, quantity: 1 }] }), /no longer/);
      const [stock] = await pool.query('SELECT stock FROM products'); assert.equal(stock[0].stock, 1);
      const [orders] = await pool.query('SELECT COUNT(*) AS count FROM orders'); assert.equal(orders[0].count, 0);
    });

    await t.test('item insert failure rolls back order, items and stock', async () => {
      await reset();
      await pool.query("CREATE TRIGGER fail_order_item BEFORE INSERT ON orderItems FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'forced fixture insert failure'");
      try { await assert.rejects(createPendingOrder(pool, 1, input), /forced fixture/); }
      finally { await pool.query('DROP TRIGGER fail_order_item'); }
      const [stock] = await pool.query('SELECT stock FROM products'); assert.equal(stock[0].stock, 1);
      const [orders] = await pool.query('SELECT COUNT(*) AS count FROM orders'); assert.equal(orders[0].count, 0);
      const [items] = await pool.query('SELECT COUNT(*) AS count FROM orderItems'); assert.equal(items[0].count, 0);
    });

    await t.test('repeated concurrent cancellation restores inventory only once', async () => {
      await reset(); const result = await createPendingOrder(pool, 1, input);
      await Promise.all([transitionOrder(pool, result.orderId, 'cancelled'), transitionOrder(pool, result.orderId, 'cancelled')]);
      const [stock] = await pool.query('SELECT stock FROM products'); assert.equal(stock[0].stock, 1);
      await assert.rejects(transitionOrder(pool, result.orderId, 'processing'), /Invalid order status/);
    });

    await t.test('paid/processing orders require a separate refund flow to cancel', async () => {
      await reset(); const result = await createPendingOrder(pool, 1, input);
      await transitionOrder(pool, result.orderId, 'processing');
      await assert.rejects(transitionOrder(pool, result.orderId, 'cancelled'), /Invalid order status/);
      const [stock] = await pool.query('SELECT stock FROM products'); assert.equal(stock[0].stock, 0);
    });

    await t.test('cancelling a historical order does not invent inventory', async () => {
      await reset();
      const [result] = await pool.query("INSERT INTO orders (userId, total, status) VALUES (1, 13400, 'pending')");
      await pool.execute('INSERT INTO orderItems (orderId, productId, quantity, price) VALUES (?, 1, 1, 13400)', [result.insertId]);
      await transitionOrder(pool, Number(result.insertId), 'cancelled');
      const [stock] = await pool.query('SELECT stock FROM products'); assert.equal(stock[0].stock, 1);
    });

    await t.test('decimal prices total exactly in centavos', async () => {
      await reset(3, '0.10'); const result = await createPendingOrder(pool, 1, { items: [{ productId: 1, quantity: 3 }] });
      assert.equal(result.total, '0.30');
    });

    const checkoutInput = () => ({ ...input, provider: 'stripe', requestKey: randomUUID(), shippingAddress: { name: 'Fixture', email: 'fixture@example.invalid', phone: '5555555555', address: 'Fixture 123', city: 'CDMX', postalCode: '01000' } });
    const client = async () => ({ sessionId: 'cs_fixture', url: 'https://checkout.stripe.com/c/pay/fixture' });

    await t.test('repeated checkout reuses order/session and rejects changed carts', async () => {
      await reset(2); const request = checkoutInput(); let calls = 0;
      const clients = { stripe: async () => { calls++; return client(); } };
      const first = await startCheckout(pool, 1, request, {}, clients);
      const repeat = await startCheckout(pool, 1, request, {}, clients);
      assert.equal(first.reference, repeat.reference); assert.equal(calls, 1);
      const [stock] = await pool.query('SELECT stock FROM products'); assert.equal(stock[0].stock, 1);
      await assert.rejects(startCheckout(pool, 1, { ...request, items: [{ productId: 1, quantity: 2 }] }, {}, clients), /different cart/);
      await assert.rejects(checkoutStatus(pool, 2, first.reference), /not found/);
    });

    await t.test('ambiguous Mercado Pago creation never automatically creates another session', async () => {
      await reset(); const request = { ...checkoutInput(), provider: 'mercadopago' }; let calls = 0;
      const clients = { mercadopago: async () => { calls++; throw new Error('timeout'); } };
      await assert.rejects(startCheckout(pool, 1, request, {}, clients), /reconciliation/);
      await assert.rejects(startCheckout(pool, 1, request, {}, clients), /reconciliation/);
      assert.equal(calls, 1);
      const [attempts] = await pool.query('SELECT state FROM paymentAttempts'); assert.equal(attempts[0].state, 'review');
    });

    await t.test('duplicate Stripe settlement records one event and does not deduct stock again', async () => {
      await reset(); const result = await startCheckout(pool, 1, checkoutInput(), {}, { stripe: client });
      const payment = { id: 'cs_fixture', payment_intent: 'pi_fixture', client_reference_id: result.reference, payment_status: 'paid', currency: 'mxn', amount_total: 1340000 };
      await Promise.all([settleCheckout(pool, 'stripe', 'evt_fixture', payment), settleCheckout(pool, 'stripe', 'evt_fixture', payment)]);
      assert.equal((await checkoutStatus(pool, 1, result.reference)).state, 'paid');
      const [events] = await pool.query('SELECT COUNT(*) AS count FROM paymentEvents'); assert.equal(events[0].count, 1);
      const [stock] = await pool.query('SELECT stock FROM products'); assert.equal(stock[0].stock, 0);
      const [orders] = await pool.query('SELECT status FROM orders'); assert.equal(orders[0].status, 'processing');
    });

    await t.test('wrong amount cannot settle and pending hosted sessions cannot be cancelled locally', async () => {
      await reset(); const result = await startCheckout(pool, 1, checkoutInput(), {}, { stripe: client });
      const payment = { id: 'cs_fixture', payment_intent: 'pi_fixture', client_reference_id: result.reference, payment_status: 'paid', currency: 'mxn', amount_total: 1 };
      await assert.rejects(settleCheckout(pool, 'stripe', 'evt_wrong', payment), /does not match/);
      assert.equal((await checkoutStatus(pool, 1, result.reference)).state, 'pending');
      await assert.rejects(transitionOrder(pool, result.orderId, 'cancelled'), /reconcile the provider/);
      const [events] = await pool.query('SELECT COUNT(*) AS count FROM paymentEvents'); assert.equal(events[0].count, 0);
    });

    await t.test('approved Mercado Pago settlement is deduplicated using provider lookup data', async () => {
      await reset(); const result = await startCheckout(pool, 1, { ...checkoutInput(), provider: 'mercadopago' }, {}, { mercadopago: async () => ({ sessionId: 'pref_fixture', url: 'https://mercadopago.com.mx/checkout/fixture' }) });
      const payment = { id: 123456, external_reference: result.reference, status: 'approved', currency_id: 'MXN', transaction_amount: 13400 };
      await settleCheckout(pool, 'mercadopago', '123456:approved', payment);
      await settleCheckout(pool, 'mercadopago', '123456:approved', payment);
      assert.equal((await checkoutStatus(pool, 1, result.reference)).state, 'paid');
      const [events] = await pool.query('SELECT COUNT(*) AS count FROM paymentEvents'); assert.equal(events[0].count, 1);
    });
  } finally { await pool.end(); }
});
