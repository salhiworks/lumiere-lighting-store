# Checkout, orders and stock

Checkout is optional. The store, cart and admin work without it, and the cart says "Checkout unavailable" until every setting below is in place. Payments use Stripe-hosted Checkout; nothing about cards ever touches this server.

## Turn it on (Stripe test mode)

1. Run `supabase/migrations/20261101150000_orders_checkout.sql` after the first migration (SQL Editor, or `supabase db push`).
2. In Stripe's dashboard, stay in **test mode** and copy the secret key (`sk_test_…`).
3. Create a webhook endpoint for `https://<your-domain>/api/webhooks/stripe` with these four events, and copy its signing secret (`whsec_…`):
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`

   Locally, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` instead; it prints a `whsec_…` for your machine.
4. Set these on the server (`.env.local` locally, the host's panel in production), then restart or rebuild:

| Variable | Example | Meaning |
| --- | --- | --- |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` | Lets the server write orders. Server only: never `NEXT_PUBLIC_`. |
| `STRIPE_SECRET_KEY` | `sk_test_…` | Live keys are refused unless `CHECKOUT_ALLOW_LIVE_PAYMENTS=true`. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | From the endpoint in step 3. |
| `CHECKOUT_SHIPPING_COUNTRIES` | `US,CA` | Where you ship. Stripe only accepts addresses there. |
| `CHECKOUT_SHIPPING_CENTS` | `2500` | One flat charge per order, in cents. `0` means free shipping. |
| `CHECKOUT_TAX` | `none` | `none`: prices are final. `stripe`: Stripe Tax adds tax (set it up in Stripe first). |
| `NEXT_PUBLIC_SITE_URL` | `https://lumiere.example` | Where Stripe sends customers back. |

Nothing is guessed: there is no default shipping price, country list or tax treatment. The Orders page in the admin lists exactly what is missing.

**Real payments** need a live key *and* `CHECKOUT_ALLOW_LIVE_PAYMENTS=true`. Never set it on a public demo.

## How a checkout runs

1. The cart sends product IDs and quantities only. Prices, totals, visibility and stock are re-read on the server.
2. `checkout_create_order` (one database transaction):
   - locks the product rows
   - checks every line: published, same currency, 1–10 units, enough stock
   - reserves the stock
   - records a **pending** order with frozen line snapshots (name, finish, unit price) and the totals
   - Anything wrong comes back as a per-line message, and nothing is reserved.
3. The server opens a Stripe Checkout Session for exactly those lines plus the shipping charge.
   - It asks for the shipping address and phone, limited to your countries.
   - It expires 32 minutes after the order was created.
   - An idempotency key ties it to the order: one session per order, even on retries.
4. Stripe confirms payment by webhook. The success page also asks Stripe directly.
   - Only Stripe's word changes payment status. Visiting the success URL marks nothing paid.
5. Leaving the payment page ends the session at Stripe, so the reserved pendants go back on sale straight away.

The browser keeps one request ID per checkout attempt. A double click, or a retry after a dropped connection, reuses the same order and the same payment page.

## Why stock can't oversell

- **Available units.** `products.stock` is the number of units available to sell. A checkout takes units out at the start, inside a transaction that holds row locks on those products. Locks are taken in product ID order, so concurrent checkouts queue instead of deadlocking.
- **Tested.** On the real database, 12 simultaneous checkouts for 3 units sold exactly 3.
- **Releasing.** Units go back only when the payment can no longer succeed:
  - Stripe reports the session **expired**
  - a delayed payment **failed**
  - the order never got a payment page
- **No guessing.** Stock is never released on a timer or a guess, and never while a payment is still processing.
- **Late payments.** A payment confirmed after its stock was released takes the units again if they are still there. If they aren't, the order is flagged **Needs review**, never dropped.
- **Final states.** Paid orders are never downgraded by a late "expired" or "failed".

## Payment state machine

All transitions happen in `checkout_apply_outcome`, which locks the order row and records the provider's event ID in `payment_events`.

| From | Event | To | Stock |
| --- | --- | --- | --- |
| pending | completed, paid | paid | stays sold |
| pending | completed, payment still clearing (bank debit…) | processing | held |
| pending / processing | async payment succeeded | paid | stays sold |
| pending / processing | async payment failed | failed | released |
| pending | session expired (or left the payment page) | expired | released |
| expired / failed | paid (late) | paid, or needs review if sold out | re-reserved if possible |
| paid / needs review | anything | unchanged | unchanged |

- **Duplicate deliveries** of the same event ID change nothing.
- **Mismatched events:** an event whose session doesn't match the order's is recorded and ignored.
- **Amount check:** a charge that doesn't equal the order total (plus Stripe's tax) is flagged Needs review.

## Webhooks

`app/api/webhooks/stripe/route.ts` checks the signature against the raw body. It ignores events for other apps on the same Stripe account, and applies each event once. If the database can't record an event, it answers 500, so Stripe retries (for up to three days in live mode, a few hours in test mode) instead of the event being lost.

## No background worker

Hostinger's Node.js hosting doesn't run workers, and none is needed:
- **Webhooks** settle almost every order.
- **Safety net:** open orders whose payment page should have ended are re-checked with Stripe on the next checkout and on every visit to the admin's Orders page.
  - An order that never got a payment page is released after 45 minutes; by then no page for it can still be open.
- **By hand:** an order page has **Check payment with Stripe** for a single order.

## Orders in the admin

`/admin/orders` lists orders with filters (To ship, Awaiting payment, Needs review, Shipped, Not completed) and search by number, name or email. An order page shows:
- the frozen lines and totals
- the customer and shipping address
- the payment record (status, Stripe IDs, received events)
- the fulfillment form: status, carrier, tracking number and link, internal note

Fulfillment can only change once an order is paid; the database enforces it. Payment status has no edit control and can't be changed through the API, by admins or anyone else.

## Customers

The return pages (`/checkout/complete`, `/checkout/canceled`) are reached through an unguessable 64-character key in the link. They show the order's items, totals, status and tracking, but no contact or address details. They are `noindex`.

## Not included yet

- Refunds and cancellations of paid orders (do them in Stripe)
- Order emails
- More than one flat shipping rate
- Discounts
