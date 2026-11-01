/*
 * Supabase is optional. With neither variable set, the store runs on the built-in demo catalog (lib/catalog/demo-data.ts) and the
 * admin explains how to connect a project. Setting only one of them is treated as a mistake, never as demo mode.
 *
 * The store and admin use only the publishable key (or the legacy anon key): admin work runs with the administrator's own session,
 * and Row Level Security decides what it may change. Only checkout needs the secret key, on the server (lib/supabase/service.ts).
 */

import { PUBLIC_DEMO } from "@/lib/public-demo";

export type SupabaseConfig = { url: string; key: string };

/**
 * Session cookie settings, shared by every place that writes them (lib/supabase/server.ts and proxy.ts). No browser code ever reads
 * the Supabase session in this app, so the cookies are httpOnly; they are Secure whenever the site runs on https.
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
};

export class SupabaseConfigError extends Error {
  name = "SupabaseConfigError";
}

export function getSupabaseConfig(): SupabaseConfig | null {
  // The public demo build ignores any Supabase settings it finds: it must never reach a real project.
  if (PUBLIC_DEMO) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined;
  // An empty line copied from .env.example counts as unset, so it never hides a legacy anon key set below it.
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || undefined;
  if (!url && !key) return null;
  if (!url || !key) {
    throw new SupabaseConfigError(
      "Supabase is only half configured. Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or remove both to run the demo catalog.",
    );
  }
  if (!/^https?:\/\/[^\s/]+/.test(url)) {
    throw new SupabaseConfigError(`NEXT_PUBLIC_SUPABASE_URL must be the project URL, e.g. https://abcd1234.supabase.co (got "${url}").`);
  }
  return { url: url.replace(/\/+$/, ""), key };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export function requireSupabaseConfig(): SupabaseConfig {
  const config = getSupabaseConfig();
  if (!config) throw new SupabaseConfigError("Supabase is not configured: this action needs NEXT_PUBLIC_SUPABASE_URL and a publishable key.");
  return config;
}
