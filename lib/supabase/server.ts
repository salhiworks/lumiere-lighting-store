import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "./database.types";
import { requireSupabaseConfig, SESSION_COOKIE_OPTIONS } from "./config";

/*
 * A client acting as the signed-in visitor, from the session cookies. Used by the admin's pages and Server Actions, so every
 * query and upload runs under the administrator's own rights and Row Level Security has the final say.
 * Create one per request; never share it.
 */
export async function createSupabaseServerClient() {
  // Session work only ever happens for a real request: this stops Next.js from attempting to prerender admin pages past this point.
  await connection();
  const { url, key } = requireSupabaseConfig();
  const cookieStore = await cookies();
  return createServerClient<Database>(url, key, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot set cookies. proxy.ts refreshes the session before admin pages render, so this is safe.
        }
      },
    },
  });
}
