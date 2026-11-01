/*
 * The public live demo (`npm run build:demo`). The flag is written into the build by next.config.ts, so a demo build stays a demo
 * whatever the server's environment says at runtime: it never connects to Supabase, has no admin, and takes no orders.
 */
export const PUBLIC_DEMO = process.env.LUMIERE_PUBLIC_DEMO === "true";
