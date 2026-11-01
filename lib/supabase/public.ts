import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { requireSupabaseConfig } from "./config";

/*
 * A signed-out client for public catalog reads. It sends no cookies, so its results are the same for every visitor and can be
 * cached ("use cache" scopes cannot read cookies anyway). Row Level Security limits it to collections and published products.
 */
export function createSupabasePublicClient() {
  const { url, key } = requireSupabaseConfig();
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
