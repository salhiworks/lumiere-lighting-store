# Supabase: schema, security and troubleshooting

Setup steps are in the README ("Connect Supabase" and "Create your administrator"). This page explains what the SQL creates and why the store is safe with only the publishable key.

## What the SQL creates

Two migrations, run in order. Both are idempotent, so re-running them repairs a partial setup or updates an older one.
- `supabase/migrations/20261101120000_catalog_and_admin.sql`: the catalog, administrators and photo storage.
- `supabase/migrations/20261101150000_orders_checkout.sql`: orders, order lines, payment events and the checkout functions. See [`CHECKOUT.md`](CHECKOUT.md).

`supabase/seed.sql` adds the three collections and the eight original pendants, with their original IDs and prices. It skips rows that already exist.

Two ways to run them:
- **SQL Editor:** paste each file and run it, migration first.
- **Supabase CLI**, from the project folder:
  1. `supabase db push --linked --project-ref <ref>` applies the migrations and records them in the project's migration history.
  2. `supabase db query --linked --project-ref <ref> --file supabase/seed.sql` adds the products.

| Table | Holds | Read through the API | Written through the API |
| --- | --- | --- | --- |
| `collections` | id, name, description, sort order | everyone | nobody (edit in the dashboard) |
| `products` | everything a product page, the rail and the cart need (below) | everyone: published rows only; administrators: every row | administrators: insert and update; no deletes |
| `admin_users` | the user IDs of administrators | each signed-in user sees only their own row, that is, whether they are an administrator | nobody (SQL editor only) |
| `orders` | totals, payment and fulfillment status, Stripe IDs, customer contact and shipping address | administrators only | administrators: fulfillment columns only; everything else only through the server's checkout functions |
| `order_items` | each line as purchased: product, name, finish, unit price, quantity | administrators only | nobody (frozen at checkout; a trigger refuses edits) |
| `payment_events` | every Stripe event applied, by event ID (idempotency) | administrators only | nobody (server functions only) |

`products` columns:
- **Identity:** `id` is stable and used by carts. It can never change; a trigger refuses it. `slug` is the URL name.
- **Copy:** `name`, `finish`, `collection_id`, `summary`, `description`, `highlights` (up to 6), `specs` (up to 12 label/value pairs).
- **Price and stock:** `price_cents` (integer minor units), `currency` (ISO code, default `USD`), `stock`, `diameter_cm`.
- **Photos:** `image_off`, `image_on`, `image_alt`, `image_width`, `image_height`. The photo paths must look like `/lamps/….webp|png`.
- **Rail and visibility:** `cord_drop` (cord length on the rail), `is_published`, `sort_order`, and the `created_at` / `updated_at` timestamps.

Check constraints repeat the essential limits (lengths, ranges, patterns), so bad data is refused by the database as well as by the app.

## Security model

**Who is an administrator.** Two things must hold, and `public.is_admin()` checks both for the caller:
1. **Listed:** the user has a row in `admin_users`.
   - Signing up, or editing your own user metadata, can never add one.
   - Removing the row revokes access at once: every page, save and upload checks the database, not a token claim.
2. **Still signed in:** the access token's session still exists.
   - Signing out normally ends a session, but its access token stays valid until it expires (an hour by default).
   - With this check, signing out ends admin rights immediately, in the admin, the Data API and Storage, even for a copied token.

**The two functions:**
- `is_admin()` runs with the caller's own rights (`security invoker`). The `admin_users` policy lets each user see only their own row, which is all it needs.
- The session check, `private.session_is_active()`, is `security definer`, because only the database owner can read `auth.sessions`.
  - It lives in the `private` schema, which the Data API doesn't expose, so policies can use it but it can't be called over HTTP.
  - It only ever answers for the caller's own session.
- Both have an empty `search_path`, and only signed-in users may execute them.

**Grants.** All table privileges are first revoked from `anon` and `authenticated`. The migration then grants exactly:
- `select` on `collections` and `products` to both roles
- `insert` and `update` on `products` to `authenticated`
- `select` on `admin_users` to `authenticated` (filtered to their own row)

There is no `delete` anywhere, and no write access to `admin_users`.

**Row Level Security policies:**

| Table | Policy | Who | Allows |
| --- | --- | --- | --- |
| `collections` | Collections are public | anon, authenticated | select |
| `products` | Published products are public | anon | select where `is_published` |
| `products` | Signed-in users see published products, admins see all | authenticated | select where `is_published` or `is_admin()` |
| `products` | Admins can add products | authenticated | insert, if `is_admin()` |
| `products` | Admins can edit products | authenticated | update, if `is_admin()` |
| `admin_users` | Users can see their own admin row | authenticated | select of their own row |
| `storage.objects` | Admins can list / upload / replace / remove lamp photos | authenticated | select / insert / update / delete in `lamp-photos`, if `is_admin()` |

**Storage.** The `lamp-photos` bucket is public, so anyone can download a photo by its URL; the storefront needs that.
- It accepts only `image/webp` and `image/png`, up to 4 MB per file.
- Only administrators can list, add, replace or remove files, or get a signed upload URL.

**Auth settings.** Turn off **Allow new users to sign up** (README). Supabase's **leaked password protection** (checking new passwords against HaveIBeenPwned) is worth enabling on plans that include it.

**In the app:**
- **Keys.** The storefront reads with the publishable key and no cookies (`lib/supabase/public.ts`). It also filters on `is_published`, although the policies already enforce it.
- **Sessions.** Admin pages and Server Actions use the visitor's session cookie (`lib/supabase/server.ts`, `@supabase/ssr`).
  - `proxy.ts` refreshes an expired access token on `/admin` requests.
  - It also sends anyone who isn't a signed-in administrator to `/admin/login` with a real redirect, before the page renders.
  - Every admin page and Server Action then calls `requireAdmin()` (`lib/admin/auth.ts`), which asks the database `is_admin()` again. Hiding a button is never the only protection.
  - An account that signs in without admin rights is signed out again, with a message explaining why.
- **Cookies and caching.** Session cookies are `httpOnly` and `SameSite=Lax`, and `Secure` when `NEXT_PUBLIC_SITE_URL` starts with `https://`. Admin responses send `Cache-Control: private, no-store`, and admin pages are `noindex`.
- **Input.** Every field is validated on the server with zod (`lib/admin/product-input.ts`). Prices are parsed from text to integer cents without floating point.
- **Photos.** Photos go straight from the browser to Storage, never through the store's server (`app/admin/actions.ts`):
  - `preparePhotoUpload` checks the administrator, the form and the photos' reported type, size and canvas. Then it signs two single-use upload URLs for new, unique paths under `products/<id>/`. A taken URL name or a mismatched pair is refused before anything is uploaded.
  - The browser uploads the files to those URLs. The bucket enforces its size and type limits, and a path can't be overwritten.
  - `saveProduct` reads the first bytes of each stored file and checks the real format, size, canvas, transparency and matching pair (`lib/admin/image-inspect.ts`) before the product points at them.
  - Files that fail are deleted, and so are the pair a save replaces and unsaved uploads more than an hour old. The original photo paths (`/lamps/<id>-off|on.webp`) are never touched.
- **The secret key.** The store and admin never use it: even a bug in the admin UI could not write as anyone but the signed-in administrator.
  - Checkout needs it, server-side only, as `SUPABASE_SECRET_KEY`, to call the `checkout_*` functions.
  - Those functions are executable by the server role alone, not by visitors, signed-in users or administrators.
  - Even the server can't release stock directly: only the payment state machine can.

## Everyday changes

- **Collections:** edit names, descriptions and order in **Table Editor → collections**. A collection can't be deleted while products use it. New collections appear in the admin's collection menu straight away; the storefront shows a collection once it has published products.
- **Another currency:** the store sells in one currency, and the admin's price field is labelled in US dollars. To sell in, say, euros:
  1. Run `update public.products set currency = 'EUR';` and `alter table public.products alter column currency set default 'EUR';`.
  2. Relabel the price field in `components/admin/product-form.tsx`.
- **Direct database edits** made in the dashboard reach the store within a few minutes. Admin saves appear immediately.
- **Deleting a product**, if you really need to, is done in the SQL editor (`delete from public.products where id = '…';`). Its uploaded photos stay in Storage under `products/<id>/`; remove that folder in **Storage**.

## Supabase's advisors

The Security Advisor should show no warnings once the migration has run. Two notices are expected:
- **Unused index.** It appears while the catalog is small.
- **Auth DB connection strategy.** This is a plan-level setting.

## Troubleshooting

The build log, or the server log for pages, says what failed:

| Message | Fix |
| --- | --- |
| `Could not load products from Supabase: … The catalog tables are missing` | Run the migration, then the seed. |
| `… Check NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Copy the publishable key from the same project as the URL. |
| `… fetch failed … Check NEXT_PUBLIC_SUPABASE_URL and that the project is running` | Check the URL (`https://<project-ref>.supabase.co`). Free projects pause after a period of inactivity: restore yours in the dashboard. |
| `Supabase is only half configured` | Set both variables, or remove both to run the demo catalog. |
| Sign-in: "This account isn't an administrator" | Add the user to `admin_users` ([ADMIN.md](ADMIN.md#create-your-administrator)). |
| Sign-in: "This email address isn't confirmed yet" | Confirm the user under **Authentication → Users**, or create it again with **Auto Confirm User** ticked. |
| The store still shows the demo catalog | The variables weren't set when the server started or was built. Restart `npm run dev`; in production, rebuild. |
| A warning `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` in the log | Someone opened the admin with a session that had been signed out or had expired. They are sent to sign in; nothing to fix. |
| `MaxListenersExceededWarning … [ServerResponse]` in the log | Harmless. See the README's “Known limitations”. |
| The cart says "Checkout unavailable" | The admin's Orders page lists the missing settings ([`CHECKOUT.md`](CHECKOUT.md)). |
| Stripe shows webhook deliveries failing with 503 | Checkout isn't configured on that server; Stripe retries once it is. With 400, the `STRIPE_WEBHOOK_SECRET` doesn't match the endpoint. |
