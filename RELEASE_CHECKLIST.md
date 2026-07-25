# Samsung Store MX — Stripe release checklist

## Before preview

- [ ] Provision the production MySQL database.
- [ ] Run `npm run db:migrate`.
- [ ] Configure `APP_URL`, `DATABASE_URL`, `APP_SECRET`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`.
- [ ] Keep Stripe in test mode.
- [ ] Deploy a preview and register `/api/stripe-webhook` in Stripe Workbench.

## Preview verification

- [ ] Sign in as a client.
- [ ] Add multiple products and quantities to the cart.
- [ ] Confirm Stripe shows the server-side catalog prices in MXN.
- [ ] Complete payment with Stripe test card `4242 4242 4242 4242`.
- [ ] Confirm the success page changes from `unpaid` to `paid`.
- [ ] Confirm the order changes from `pending` to `processing`.
- [ ] Confirm refreshes and duplicate webhook delivery do not create a second order.
- [ ] Confirm cancellation returns to `/checkout/cancel` without a charge.
- [ ] Confirm the order is visible in “Mis pedidos” and Admin.

## Production release

- [ ] Replace test keys with restricted live Stripe credentials.
- [ ] Register the production webhook and copy its signing secret.
- [ ] Run one low-value live transaction and refund it.
- [ ] Verify the refund marks the order `refunded`.
- [ ] Enable Stripe and Vercel alerts and review runtime logs.
