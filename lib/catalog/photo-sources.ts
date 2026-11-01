/*
 * Where each original demo photo comes from, until licensed files replace it (see docs/ASSETS.md).
 *
 * The catalog always points at local paths, /lamps/<id>-off.webp and /lamps/<id>-on.webp. next.config.ts proxies those paths to the
 * original 21st.dev demo photos below, unless a file with the same name exists in public/lamps/: public files are served first, so a
 * licensed replacement pair takes over as soon as it is added, one product at a time.
 *
 * Serving the photos from the site's own origin also keeps the rail's CSS-mask drop shadows working. Hotlinked straight from the CDN,
 * the browser can reuse a cached non-CORS copy for the mask's CORS request and drop the shadow (the CDN omits `Vary: Origin`).
 *
 * The rights to these photos are unverified: the 21st.dev page labels the component MIT, which does not cover the photos.
 * Replace them with properly licensed pairs before any public release. See docs/ASSETS.md for the provenance table and pairing rules.
 */
export const PHOTO_SOURCES: Record<string, { off: string; on: string }> = {
  "dome-enamel": {
    off: "https://cdn.21st.dev/assets/mirror/fc/fcfdfbf3d62f14d97eb23453aa9fe6772f7c09b521226442621e4f187d79b4d6.webp",
    on: "https://cdn.21st.dev/assets/mirror/2d/2d2990c7f5d56e69848237695a204baf6a366d180facb94c62b78cdc3e37dd13.webp",
  },
  "glass-globe": {
    off: "https://cdn.21st.dev/assets/mirror/ba/ba2f12a44156865baeb4c1173a7d320384edc5156dcaf1d4e44e684ae780ba57.webp",
    on: "https://cdn.21st.dev/assets/mirror/a5/a55502eb9cf6cac0bd52969eb61bb546a478e861f3568aad6875e4dad5c03f6e.webp",
  },
  "cone-brass": {
    off: "https://cdn.21st.dev/assets/mirror/96/968b92c5f3adc4a3f45d627f339fa2c4017a70a0d57f7c68b8a0c5b4ace6aef3.webp",
    on: "https://cdn.21st.dev/assets/mirror/cc/cc2aa1c7f32e04bc950f63274f28986c573a8ad2c27f84eef148191a1178d424.webp",
  },
  "rattan-weave": {
    off: "https://cdn.21st.dev/assets/mirror/12/1237597f711ee8334bad09432954cf04fe8cc104877dece6d0986441e59030a9.webp",
    on: "https://cdn.21st.dev/assets/mirror/39/394b02f1dff0096ebace53699c42c4d817dfffd5aff943d888454a83036ce1fb.webp",
  },
  "paper-lantern": {
    off: "https://cdn.21st.dev/assets/mirror/dd/dd85e367f381884fa9147495c1025af4faed8a2f7ec1bc3cd82bbdc9a3c2815b.webp",
    on: "https://cdn.21st.dev/assets/mirror/a9/a9e6b40b11b3abca1a39acd32489b66f6094f3ecb5361862c16a1d36599ad60c.webp",
  },
  "concrete-cone": {
    off: "https://cdn.21st.dev/assets/mirror/a8/a89caec23d33213a849f40b76789ead7c88f0c2d91eb7e91e60987c72e566032.webp",
    on: "https://cdn.21st.dev/assets/mirror/b1/b17f53b4eb8ff9d544bc2ce66802e46c7134d760cd225f9059aec2f7799ffbb7.webp",
  },
  "fluted-glass": {
    off: "https://cdn.21st.dev/assets/mirror/14/14f8418ed6724766526e9d3efb7130163b8f6bc8cd784452ea4afdcaa980d818.webp",
    on: "https://cdn.21st.dev/assets/mirror/14/141699616e79db6eeb2667ff7dcd106822e1cb408dd4ea2c7fe5c42fa52b957f.webp",
  },
  "copper-bell": {
    off: "https://cdn.21st.dev/assets/mirror/3d/3d6d7c813c8d408fff25a92204f49cfcfa3cdf445e27b21b350c666177380c47.webp",
    on: "https://cdn.21st.dev/assets/mirror/bf/bf643df2bd7d8eb4af9aeeffa53c5ff6dca49f702b88bde2a584697ca82aa862.webp",
  },
};
