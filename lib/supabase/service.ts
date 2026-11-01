import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { PUBLIC_DEMO } from "@/lib/public-demo";
import { getSupabaseConfig } from "./config";

/*
 * The store server's own client, for checkout and payment notifications only: it calls the checkout_* database functions, which
 * nothing else may run. It uses the secret key (SUPABASE_SECRET_KEY), which never reaches the browser and is not needed at all
 * until checkout is set up. Everything else in the app keeps using the publishable key.
 */
export function getSupabaseSecretKey(): string | null {
  if (PUBLIC_DEMO) return null;
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return key || null;
}

export function createSupabaseServiceClient() {
  const config = getSupabaseConfig();
  const key = getSupabaseSecretKey();
  if (!config || !key) throw new Error("Checkout needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY on the server.");
  return createClient<Database>(config.url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
