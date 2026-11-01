# Pendant Lamp Rail: original source and integration notes

This folder keeps the 21st.dev originals exactly as supplied, so the integrated component can always be compared with them.
It is excluded from TypeScript and ESLint and is never imported by the app.

| File | What it is |
| --- | --- |
| `pendant-lamp-rail.tsx` | The original component, byte-identical to the supplied copy (SHA-256 starts `bb3601bf97b97186`). |
| `demo.tsx` | The original demo: eight lamps, their paired off/on photo URLs, copy and tags. |
| `original-prompt.txt` | The complete 21st.dev integration prompt. |
| `integration.patch` | Unified diff from the original to `components/ui/pendant-lamp-rail.tsx` as used by the store. |

- **Source:** https://21st.dev/@dhxwhy/components/pendant-lamp-rail
- **Author:** dhxwhy
- **License:** labelled MIT on the source page. The supplied files carry no license text or copyright line, so obtain the author's exact MIT notice before you redistribute this code in a public template. The label covers the code only, not the demo photos (see `docs/ASSETS.md`).

## What changed, and why

The physics, geometry, timing, animation, light model, markup and styling are untouched. Four small additions are needed to put a store inside the detail view and to run correctly under Next.js 16. The full diff is 32 changed lines.

1. **`detailAction` prop** (new, optional). Renders a call to action inside the detail view, under the price tag. Its signature is `(item, { index, close }) => ReactNode`. `close` runs the detail's own lift-back animation. The store uses it for Add to cart, View details and View cart, which avoids opening a second modal on top of the lamp.
2. **Focus trap includes links.** The trap cycled through `button, input` only, so a link inside the detail could not be reached with Tab and could leak focus. It now uses `a[href], button, input`.
3. **Close the detail when the route is hidden.** With Cache Components, Next.js hides the previous route with React `<Activity>` instead of unmounting it, and runs effect cleanups when it does. Without this, going Back to the homepage replays the detail's opening flight. A `useLayoutEffect` cleanup now closes the detail when the rail is hidden.
4. **`DetailAction` wrapper.** It renders `detailAction` as a component, so `close` arrives as a prop. Calling the render function directly during render is flagged by the React Compiler lint rule `react-hooks/refs`.

Everything else is done from outside the component, through its public API:

- Lamps come from `lib/catalog` through `toPendantLamp()`.
- The open-button label ("Lift to view") is set with the `labels` prop.
- The CTA uses the `action` prop.
- Autoplay is limited to one pass, and stops when the rail leaves the viewport, by switching the `autoplay` prop off.
- The brand serif reaches the detail title through the `[data-slot="pendant-lamp-detail"]` hook in `app/globals.css`.

## Integration requirements found while wiring it up

- **Chart tokens.** The light colour comes from `--color-chart-4` (warm in the classic shadcn light palette) and the accent from `--color-chart-1`. Current shadcn presets ship grey chart colours, which turn every beam, pool and bloom grey. `app/globals.css` sets chart-3 and chart-4 back to the classic warm values.
- **`dark:` variant.** The component carries `dark:` styles for a dark theme. Tailwind v4's default `dark:` follows the OS setting, which would apply the dark blend and shadow strengths on LUMIÈRE's light page. The variant is bound to a `.dark` class that the site never sets.
- **Same-origin photos.** The drop shadow uses each off photo as a CSS `mask`, which the browser fetches in CORS mode. The demo CDN sends `Access-Control-Allow-Origin` only to CORS requests and omits `Vary: Origin`. A cached copy from a plain `<img>` request then fails the mask's CORS check, so the shadow randomly disappears and the console shows CORS errors. The store serves every photo from its own origin under `/lamps/` instead (see `next.config.ts`).
- **Plain `<img>`.** The paired photos must render through identical boxes, so `@next/next/no-img-element` is switched off for this file, `components/product/lamp-image.tsx` and the admin's photo pair preview (`components/admin/photo-pair-field.tsx`) only.
