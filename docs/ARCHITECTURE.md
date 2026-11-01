# How LUMIÈRE fits together

## Pages

| Route | What's there |
| --- | --- |
| `/` | The lamp rail as hero, the collection bays, the studio story |
| `/shop` | All pendants, filtered by collection and sorted by price or name. The state lives in the URL, e.g. `/shop?collection=glass&sort=price-asc`. |
| `/shop/[slug]` | Product page: lit/unlit photo switch, price, stock, quantity, add to cart, specifications, more pendants. Published products are prerendered. Unknown and hidden ones return HTTP 404. |
| `/collections` | Every pendant grouped by collection |
| Cart drawer | Opens from the header, the product page and the lamp detail. Quantities, remove, subtotal and Checkout (or why it isn't open). A product that was hidden or sold out after it was added is marked as such and left out of the subtotal. |
| `/checkout/complete`, `/checkout/canceled` | Where Stripe sends customers back: the order's status as Stripe reports it, its items and totals, and tracking once shipped. Private links, `noindex`. |
| `/admin`, `/admin/orders` | Sign-in, products (list, add, edit) and orders ([ADMIN.md](ADMIN.md)) |

The shop grid shows a skeleton while it loads, and the cart has an empty state. Unknown URLs get the store's 404 page, and unexpected errors get an error page.

## How it fits together

```
app/
  (store)/                   storefront routes; their layout adds the header, cart and footer; checkout/ return pages
  admin/                     admin pages (products, orders), sign-in, Server Actions
  api/webhooks/stripe/       Stripe webhook
  not-found.tsx, error.tsx   store-framed 404 and error pages
components/
  ui/pendant-lamp-rail.tsx   the 21st.dev component (minimal store extension, see below)
  ui/button.tsx, sheet.tsx   shadcn components, restyled for LUMIÈRE
  home/ product/ shop/ cart/ layout/   storefront pieces
  admin/                     admin header, product and order tables, product form, photo pair field, fulfillment form
  checkout/                  the customer's order status page
lib/
  catalog/                   the data-access layer: index.ts, demo-data.ts, supabase-source.ts, helpers
  supabase/                  configuration, the public and session clients, database types
  admin/                     admin checks, form validation, photo checks, order queries
  checkout/                  checkout settings and the ordering flow (start, apply provider reports, reconcile)
  payments/                  the payment-provider interface and its Stripe implementation
  cart.ts                    cart store: localStorage, cross-tab sync, validation
  public-demo.ts             the public demo flag, fixed into the build by next.config.ts
proxy.ts                     real 404s for unknown product and order-status URLs; admin session refresh; non-admins redirected to sign in; everything but the store is a 404 in the public demo
supabase/                    migrations (catalog and admin; orders and checkout) and seed
reference/21st-dev/          untouched originals + integration patch (not compiled)
scripts/public-demo.mjs      builds and serves the locked public demo (npm run build:demo / start:demo)
docs/                        setup, admin, checkout, deployment, photos, architecture
```

**One catalog.** Every page and the cart read products through `lib/catalog/index.ts`:
- The functions are `getProducts()`, `getProductBySlug()`, `getCollections()` and `getCartCatalog()`.
- They read Supabase when it is configured and `demo-data.ts` when it isn't. Nothing else in the storefront knows which.
- Results are cached with `"use cache"` under the `catalog` tag, and every admin save refreshes that tag with `updateTag`.
- The rail gets its items from `toPendantLamp()`, so the rail's name and price tag, a product card and a product page cannot disagree.

**Cart.** `lib/cart.ts` stores only `{ productId, quantity }` lines under `lumiere.cart.v1`.
- Names, prices and stock always come from a snapshot of the published catalog that the server sends with each page.
- Quantities are clamped to stock, at most 10 each.
- Components read the cart through `useSyncExternalStore` with an empty server snapshot, so hydration never mismatches.
- Changes made in another tab sync automatically.

**Next.js 16.** The project uses Cache Components and Partial Prefetching.
- Pages are prerendered. Request-dependent parts, such as the shop's filters and the admin, render for each request.
- `proxy.ts` checks product URLs before a page starts streaming, so a missing product gets a real 404 status, not a 200 with a not-found message.
- Next keeps recently visited routes mounted but hidden (React `<Activity>`). So the rail closes its detail view when hidden, the cart drawer closes on Back/Forward, and the new-product form starts empty on every visit.

## The Pendant Lamp Rail: what was kept, what changed

Kept exactly:
- The brushed track and the shaped pendants.
- The light model: crossfade, bloom, beams, pools, shadows.
- The pendulum physics, with drag along the rail, collisions and spring-back.
- Hover/brush-to-light, the intro sway and the animated lift-to-detail with its dimmer.
- The touch carousel under about 690 px.
- Keyboard navigation (arrows, Home/End, Enter), the focus trap, Escape and focus return.
- Reduced motion.

Changed, 32 lines in total. The full patch and reasoning are in [`reference/21st-dev/README.md`](../reference/21st-dev/README.md).
- A `detailAction` prop renders Add to cart, View details and View cart inside the existing detail, so no second modal is ever stacked on it.
- The detail's focus trap now includes links.
- The detail closes when Next.js hides the route.

Configured from outside the component, through its props:
- The open label reads "Lift to view".
- Autoplay lights each lamp once, then stops. It also stops if the rail scrolls away, so the caption's live region doesn't announce forever.

Theme requirements the rail relies on, both set in `app/globals.css`:
- A warm `--color-chart-4` for its light.
- A class-based `dark:` variant.

## Accessibility and motion

- Semantic landmarks, a skip link, and one `h1` per page.
- Visible brass focus rings, and labelled steppers, switches, filters and form fields. Admin errors are tied to their fields.
- Live regions for cart changes and admin save results.
- Checkout stays focusable with `aria-disabled` and an explanation.
- `prefers-reduced-motion` disables the rail physics and autoplay, card swings and transitions.
- Text contrast is at least 5:1 on every surface.
