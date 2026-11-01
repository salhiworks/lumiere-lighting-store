import type { NextConfig } from "next";
import { PHOTO_SOURCES } from "./lib/catalog/photo-sources";

/* The public demo build (scripts/public-demo.mjs) never talks to Supabase: no uploads proxy, and the flag is fixed into the build. */
const publicDemo = process.env.LUMIERE_PUBLIC_DEMO === "true";
const supabaseUrl = publicDemo ? undefined : process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  env: { LUMIERE_PUBLIC_DEMO: publicDemo ? "true" : "" },
  // Server Actions keep Next.js's default 1 MB body limit: admin photo uploads go straight to Supabase Storage, not through here.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  /*
   * Lamp photos are always served from this site, which keeps the rail's CSS-mask shadows working (see docs/ASSETS.md):
   *   /lamps/<id>-off.webp, /lamps/<id>-on.webp  the original demo pairs, proxied to their source (lib/catalog/photo-sources.ts)
   *   /lamps/uploads/...                          photos uploaded in the admin, proxied to the Supabase "lamp-photos" bucket
   * These are "afterFiles" rewrites, so a real file in public/lamps/ with the same name always wins over the proxy.
   */
  async rewrites() {
    return [
      ...Object.entries(PHOTO_SOURCES).flatMap(([id, photo]) => [
        { source: `/lamps/${id}-off.webp`, destination: photo.off },
        { source: `/lamps/${id}-on.webp`, destination: photo.on },
      ]),
      ...(supabaseUrl ? [{ source: "/lamps/uploads/:path*", destination: `${supabaseUrl}/storage/v1/object/public/lamp-photos/:path*` }] : []),
    ];
  },
};

export default nextConfig;
