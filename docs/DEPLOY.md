# Deploying LUMIÈRE (Hostinger or any Node.js host)

LUMIÈRE is a standard Next.js server: it needs a Node.js host, not static hosting. It uses no Vercel-only features, background workers, queues or databases of its own.

## What the host must provide

| Need | Value |
| --- | --- |
| Node.js | 22 or newer (`engines` in `package.json`; the Supabase client requires it) |
| Install | `npm ci` (uses the committed `package-lock.json`) |
| Port | the host's `PORT` variable: both start commands use it |
| Outbound HTTPS | the photo host for the original lamp photos (see below); Supabase and Stripe, if you use them |
| Instances | one. Caches live in the server's memory |

## Choose what you deploy

| | Public demo | Your store |
| --- | --- | --- |
| Build command | `npm run build:demo` | `npm run build` |
| Start command | `npm run start:demo` | `npm start` |
| Environment variables | only `NEXT_PUBLIC_SITE_URL` | `NEXT_PUBLIC_SITE_URL`, plus Supabase (and optionally checkout) settings |
| What runs | the eight demo pendants, the rail, the cart. No admin, no checkout, no database | everything you have configured |

The demo build is locked when it is built:
- It ignores any Supabase or Stripe settings, even if they are present on the server.
- `/admin`, `/checkout` and the payment webhook are 404.
- It never contacts Supabase or Stripe.

That makes it safe to host next to, or instead of, a real store.

## Hostinger, step by step

1. In hPanel, create a **Node.js web app** (on a plan that includes Node.js apps, such as Business or Cloud), not a static website.
2. Connect the GitHub repository, or upload the project without `node_modules` and `.next`.
3. Choose Node.js **22** (or newer), and set the build and start commands from the table above.
4. Add the environment variables **before the first build**. Their values are read at build time, so any later change needs a rebuild. Never add `.env.local` to the repository.
   - Demo: `NEXT_PUBLIC_SITE_URL=https://your-demo-domain`
   - Store: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Checkout (optional): the settings in [CHECKOUT.md](CHECKOUT.md)
5. Deploy, then connect your domain in hPanel and turn on SSL.
6. Make sure `NEXT_PUBLIC_SITE_URL` is the final `https://` address (this also marks the admin's cookie Secure), and rebuild.
7. Check the live site:
   - The homepage rail lights up and the photos load.
   - `/shop` and a product page open.
   - `/admin` signs in (store) or is a 404 (demo).
   - An address like `/shop/no-such-lamp` returns 404.

For checkout, also point a Stripe webhook at `https://your-domain/api/webhooks/stripe` ([CHECKOUT.md](CHECKOUT.md)).

## Good to know

- **Photos.** The original lamp photos are fetched from their source on first request and served from your own domain. Put files with the same names in `public/lamps/` to serve them yourself. Check their rights first: see [ASSETS.md](ASSETS.md).
- **No background jobs.** Stripe's webhooks settle orders. Anything a webhook missed is re-checked with Stripe on the next checkout or visit to the admin's Orders page.
- **Logs.** Next.js 16 can print a harmless `MaxListenersExceededWarning` (README, "Known limitations").
