# Lamp photos: provenance, rights and replacement

## Status

**Rights unverified. Replace these photos with ones you own or have licensed before selling real products.**

The 16 photos (8 pairs) are the ones the 21st.dev *Pendant Lamp Rail* demo loads from `cdn.21st.dev/assets/mirror/…`. The 21st.dev page labels the component as MIT, but that label covers the code only. Nothing states who made the photos or under what terms they may be reused. This repository does not contain them: the store loads them from the 21st.dev demo CDN through its own address, and the demo shows them only to present the component.

## How the photos are served

Products only ever point at paths on the store's own address. The original pairs use these paths, both in the demo catalog (`lib/catalog/demo-data.ts`) and in the Supabase seed (`supabase/seed.sql`):

```
/lamps/<product-id>-off.webp
/lamps/<product-id>-on.webp
```

`next.config.ts` proxies these paths to the original CDN URLs listed in `lib/catalog/photo-sources.ts`. They are "afterFiles" rewrites, so a real file in `public/lamps/` with the same name is always served instead. That means:

- The browser never hotlinks the CDN. Every photo is same-origin, which the rail needs for its CSS-mask drop shadows. Hotlinked, the masks fail at random because the CDN omits `Vary: Origin`.
- Replacing a photo needs no code change: add the file under `public/lamps/` and it takes over.
- The proxy needs a Node.js server (`next start`). A static export would need the files in `public/lamps/`.

## Photos uploaded in the admin

The admin stores a new pair in the Supabase bucket `lamp-photos`, as `products/<product-id>/off-<stamp>.<ext>` and `on-<stamp>.<ext>`. The browser uploads the files straight to Storage through single-use signed URLs, so they never pass through the store's server.
- The product then points at `/lamps/uploads/products/<product-id>/…`. `next.config.ts` proxies that path to the bucket, so uploaded photos are same-origin too.
- Every upload gets a new name, so browsers never show a cached old photo.
- The files a save replaces are deleted afterwards, and so are uploads in that folder that were never saved and are more than an hour old.
- Uploading never modifies or deletes the original pairs above. It only repoints the product; the original files stay where they are.

The admin checks each pair against the rules in the next section: first what the browser reports before the upload, then the stored files' own bytes before the product uses them. It refuses to save unless both photos meet all of these:
- PNG or WebP (read from the file's contents), at most 4 MB
- 300–4000 × 450–6000 px
- portrait, with the width 55–72% of the height
- an alpha channel
- identical canvas sizes

The preview then checks the pixels and warns, without blocking, about:
- opaque corners
- a missing cord at the top centre
- a lamp reaching below 85% of the height
- a pair that doesn't line up: a shift of more than 2% of the width, or shades overlapping by less than 90%

## Provenance

All files are transparent WebP, 557 × 900 px, as downloaded on 2026-11-01.

| Product ID | Photo | Local path | Original URL (cdn.21st.dev/assets/mirror/…) | Size |
| --- | --- | --- | --- | --- |
| dome-enamel | off | /lamps/dome-enamel-off.webp | fc/fcfdfbf3d62f14d97eb23453aa9fe6772f7c09b521226442621e4f187d79b4d6.webp | 27 KB |
| dome-enamel | on | /lamps/dome-enamel-on.webp | 2d/2d2990c7f5d56e69848237695a204baf6a366d180facb94c62b78cdc3e37dd13.webp | 27 KB |
| glass-globe | off | /lamps/glass-globe-off.webp | ba/ba2f12a44156865baeb4c1173a7d320384edc5156dcaf1d4e44e684ae780ba57.webp | 57 KB |
| glass-globe | on | /lamps/glass-globe-on.webp | a5/a55502eb9cf6cac0bd52969eb61bb546a478e861f3568aad6875e4dad5c03f6e.webp | 43 KB |
| cone-brass | off | /lamps/cone-brass-off.webp | 96/968b92c5f3adc4a3f45d627f339fa2c4017a70a0d57f7c68b8a0c5b4ace6aef3.webp | 27 KB |
| cone-brass | on | /lamps/cone-brass-on.webp | cc/cc2aa1c7f32e04bc950f63274f28986c573a8ad2c27f84eef148191a1178d424.webp | 26 KB |
| rattan-weave | off | /lamps/rattan-weave-off.webp | 12/1237597f711ee8334bad09432954cf04fe8cc104877dece6d0986441e59030a9.webp | 93 KB |
| rattan-weave | on | /lamps/rattan-weave-on.webp | 39/394b02f1dff0096ebace53699c42c4d817dfffd5aff943d888454a83036ce1fb.webp | 59 KB |
| paper-lantern | off | /lamps/paper-lantern-off.webp | dd/dd85e367f381884fa9147495c1025af4faed8a2f7ec1bc3cd82bbdc9a3c2815b.webp | 38 KB |
| paper-lantern | on | /lamps/paper-lantern-on.webp | a9/a9e6b40b11b3abca1a39acd32489b66f6094f3ecb5361862c16a1d36599ad60c.webp | 40 KB |
| concrete-cone | off | /lamps/concrete-cone-off.webp | a8/a89caec23d33213a849f40b76789ead7c88f0c2d91eb7e91e60987c72e566032.webp | 37 KB |
| concrete-cone | on | /lamps/concrete-cone-on.webp | b1/b17f53b4eb8ff9d544bc2ce66802e46c7134d760cd225f9059aec2f7799ffbb7.webp | 36 KB |
| fluted-glass | off | /lamps/fluted-glass-off.webp | 14/14f8418ed6724766526e9d3efb7130163b8f6bc8cd784452ea4afdcaa980d818.webp | 16 KB |
| fluted-glass | on | /lamps/fluted-glass-on.webp | 14/141699616e79db6eeb2667ff7dcd106822e1cb408dd4ea2c7fe5c42fa52b957f.webp | 18 KB |
| copper-bell | off | /lamps/copper-bell-off.webp | 3d/3d6d7c813c8d408fff25a92204f49cfcfa3cdf445e27b21b350c666177380c47.webp | 30 KB |
| copper-bell | on | /lamps/copper-bell-on.webp | bf/bf643df2bd7d8eb4af9aeeffa53c5ff6dca49f702b88bde2a584697ca82aa862.webp | 31 KB |

The proxy was checked to return byte-identical files for all 16 paths.

## What a replacement pair must match

The rail's switch-on illusion only works when the lit photo lands on exactly the same pixels as the unlit one. The rail also builds each lamp's cord from the photo's top rows, and its hit areas assume the same proportions. Measured on the current set:

1. **Canvas:** 557 × 900 px (≈ 0.62, the component draws it inside a 2:3 box with `object-fit: contain`, top-aligned). Keep the same canvas for every photo in the set.
2. **Transparent background**, cut out cleanly, no baked-in shadow (the rail adds its own).
3. **Cord from the top edge**, centred at 50% of the width, about 9–15 px wide at this size. The top rows must be cord only.
4. **Same scale across the set:** shades end between 70% and 78% of the canvas height; nothing important below about 80%.
5. **Off and on photos of a pair identical in framing:** same camera, position and scale; only the light changes. In the current set, each pair's alpha bounds match to within about a pixel, and the opaque shades overlap almost exactly (intersection over union ≈ 0.99; lower only where glass and rattan let light through).
6. **WebP**, roughly 15–100 KB per file.

## Replacing the photos

1. Shoot or commission the pairs, or license them, under terms that allow use in a public template and a commercial store. Keep the license or invoice with the project.
2. Put them in place, either way:
   - **With Supabase:** upload each pair on the product's page in the admin. The checks above run before anything is stored.
   - **Without Supabase, or to ship them with the code:** export with the names above into `public/lamps/` (for example `public/lamps/dome-enamel-off.webp`). Public files win over the proxy immediately.
3. Check each pair: open the product page, toggle the light switch, and confirm nothing but the light moves. Then hover the lamp on the homepage rail and check its cord joins the track cleanly.
4. When no product uses the CDN photos any more, delete `lib/catalog/photo-sources.ts` and the demo-photo part of `rewrites()` in `next.config.ts`, and change the "Status" above.

Browsers cache the proxied photos as `immutable` for a year, because they keep the CDN's headers. If anyone has loaded the prototype, give files in `public/lamps/` new names (for example `-off-v2.webp`). Then update the product's photos: `images` in `lib/catalog/demo-data.ts`, or the `image_off` and `image_on` columns in Supabase. Admin uploads always get new names, so they need none of this.

## Other assets

- **Fonts:** Newsreader, Albert Sans and DM Mono, self-hosted by `next/font` at build time (SIL Open Font License).
- **Icons:** lucide-react (ISC), plus a small inline SVG lamp in the empty-cart and not-found states and `app/icon.svg`, both drawn for this project.
