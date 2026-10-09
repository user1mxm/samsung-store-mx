# Samsung Store MX: orders, dual payments and VPS reconciliation

## Implemented in this branch

The checkout service calculates MXN totals from locked database product rows, ignoring
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


## VPS source reconciliation (PR following #16)

The uploaded VPS source is preserved through the actual admin/client login,
order history, admin user/product/agent pages, referral/withdrawal routes, OAuth
callbacks, notifications and both CSS 3D viewers. The manifest contains hashes
of the uploaded source, never credentials or file contents. The new deployment
refuses source drift instead of overwriting changes made after this snapshot.

Changes found during reconciliation:

- Register the existing admin upload and disk-image handlers in boot.ts, configure
  their storage fields, and connect the admin image picker to multipart upload
  instead of storing multi-megabyte data URLs in the database. Keep existing
  public images and uploads during deployment.
- Add the missing Nodemailer dependency, pinned at 10.0.16 (Node >=20). SMTP
  delivery still requires actual server credentials and an end-to-end mail check.
- Connect the existing change/reset password UI procedures. New hashes use the
  existing salted scrypt helper; login also accepts legacy hashes. Reset-token
  consumption and password replacement use conditional atomic updates.
- Remove password hashes and reset tokens from public identity responses.
- Bound persisted cart edits with product locks; concurrent additions cannot
  exceed stock or create duplicate cart rows. Checkout still reserves separately.
- Keep the live 3D visual, but render catalogue specifications and identify the
  model/size controls as illustrative. Unknown specifications remain absent.
- Retire legacy order.create and unverified generateCommissions mutations. The
  client no longer calls them. Unverified return-URL payment confirmation also
  remains disabled. Verified, idempotent commission generation is a separate gate.

## VPS deployment

Fetch the exact reviewed PR head into a new staging directory. Run:

```bash
bash scripts/deploy-vps.sh <reviewed-commit-sha>
```

The script requires root, verifies the uploaded source hashes and expected PM2
cwd/script, installs missing rsync/MySQL client packages if needed, builds and
checks the staged app, verifies InnoDB, and checks a loopback-only shadow process
against the existing catalogue with payments disabled. No fixture tests run
against the production database.

It then stops samsung-store briefly, uses mysqldump to back up the database
(including routines, triggers and events), applies/verifies only additive schema
changes, installs the built release and runs local and HTTPS-domain health checks, including the built asset identity. PAYMENTS_ENABLED
stays 0. Missing database backup privileges or incompatible schema abort the
rollout. The original environment, uploads, public files and seed scripts are
preserved. Source/dependency/bundle backups and private logs are kept under the
printed /opt/samsung-backups/reconciled-* directory.

On failure after stopping the app, it attempts to restore the prior code, bundle
and dependencies, then restart PM2. It never restores the database automatically:
additive columns/tables remain compatible with the previous bundle. If recovery
itself fails, inspect PM2 and the private backup directory before any further
write. A successful local deployment must still be followed by domain/browser,
real account, image-upload and sandbox acceptance checks.
