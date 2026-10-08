# Samsung Store MX: orders and dual payment preparation

## Implemented in this branch

The order API calculates MXN totals from locked database product rows, ignoring
browser prices/totals. Orders, items and stock deductions commit together.
Cancellation restores inventory once for newly reserved pending orders.
Historical orders remain unreserved and do not add stock when cancelled.
Processing, shipped or delivered orders cannot be cancelled through this API;
they require a separate refund workflow.

The Stripe Checkout and Mercado Pago Checkout Pro clients accept persisted
server snapshots, build hosted checkout requests, reject unexpected redirect
hosts, and require credentials and webhook secrets. Amounts use integer centavos
internally. Stripe requests include a stable idempotency key. Mercado Pago
Preferences requests are **not** assumed idempotent; uncertain outcomes must be
reconciled before another preference is created.

Signature helpers verify Stripe's raw request body and Mercado Pago's URL data.id,
request ID and signature timestamp. Payment matching checks authoritative amount,
currency and order reference; Stripe also requires the recorded session ID.
Mercado Pago payment status must be retrieved from its API after authentication
of the notification; do not trust the incoming webhook body or return URL.

## Connected but disabled until rollout

Authenticated tRPC checkout creation and status routes are connected to the
storefront provider selector and validated shipping fields. Both webhook routes
verify signatures before recording settlement. A durable paymentAttempts ledger
serializes request keys, preserves ambiguous outcomes for review, and reuses
pending sessions; paymentEvents deduplicates settlement inside the same transaction
as order state changes. Returning to the storefront never marks an order paid.

Payments remain disabled unless PAYMENTS_ENABLED=1, complete provider configuration
is present, and the schema readiness query succeeds. No credentials were supplied
and no real provider session, payment, production migration or deployment was
performed. Mock HTTP contracts are separate from real sandbox acceptance.

## Schema gate before deployment

Back up the database, compare the VPS source with both PRs, then apply
`db/migrations/20261008_order_inventory.sql` and
`db/migrations/20261008_payment_attempts.sql` exactly once before deploying this
branch. These standalone SQL files are not wired into drizzle-kit's migration journal;
`npm run db:migrate` alone will not apply them. Verify the new column and InnoDB
engines for products/orders/orderItems before accepting order writes. Existing
orders get inventoryReserved=0 because their old creation path did not reserve
inventory. Do not mark them reserved retrospectively without evidence.

No production migration or deploy was performed from Work. The runtime cannot
reach VPS SSH. CI uses an isolated MySQL 8.4 schema called samsung_store_test.

## Activation gates

1. Reconcile the VPS source with PR #15 and this stacked PR, back up the database,
   apply both SQL migrations, and verify InnoDB engines and schema readiness.
2. Configure server-side Stripe secret key and webhook signing secret, Mercado
   Pago access token and webhook signing secret, SITE_ORIGIN, MERCADOPAGO_MODE
   (sandbox/live) and PAYMENTS_ENABLED=1. Use test/sandbox accounts first. Secrets
   must stay out of chat, browser bundles, repository and logs.
3. Register these endpoints in the corresponding provider dashboard:
   - /api/payments/stripe/webhook: checkout.session.completed and
     checkout.session.async_payment_succeeded.
   - /api/payments/mercadopago/webhook: payment notifications (data.id in URL).
4. Run real sandbox round trips for both providers: approved, declined, delayed,
   duplicate and invalid notifications, concurrent last-item purchase, reload and
   retry. The CI contracts do not prove account configuration or provider delivery.
5. Define reservation cleanup and refund/recovery operations before commercial
   activation. An ambiguous provider request is kept in review and is never retried
   automatically. Hosted pending orders cannot be cancelled locally until the
   provider checkout is revoked/reconciled. Automatic abandonment cleanup and
   refunds are not implemented. Stock remains reserved to prevent overselling.
6. Confirm shipping costs/taxes and merchant operational policies. The current
   request total is the product subtotal; no extra shipping fee is configured.
7. Deploy and repeat browser checks on the domain; verify the live viewer reflects
   the selected product's actual specifications.

Required server settings (no real values are included):

```
PAYMENTS_ENABLED=0
SITE_ORIGIN=https://samsungstore.com.mx
STRIPE_SECRET_KEY=<server-only test key>
STRIPE_WEBHOOK_SECRET=<server-only signing secret>
MERCADOPAGO_ACCESS_TOKEN=<server-only sandbox token>
MERCADOPAGO_WEBHOOK_SECRET=<server-only signing secret>
MERCADOPAGO_MODE=sandbox
```

Keep PAYMENTS_ENABLED=0 until the activation gates pass. Do not switch it off while
payments are in flight without arranging webhook processing and reconciliation.

## Official references used

- Stripe Checkout Sessions: https://docs.stripe.com/api/checkout/sessions/create
- Stripe idempotency: https://docs.stripe.com/api/idempotent_requests
- Stripe webhook signatures: https://docs.stripe.com/webhooks/signature
- Mercado Pago Preferences: https://www.mercadopago.com.mx/developers/es/reference/online-payments/checkout-pro-preferences/create-preference/post
- Mercado Pago notifications: https://www.mercadopago.com.mx/developers/en/docs/checkout-pro-preferences/payment-notifications
