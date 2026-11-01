import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import { PUBLIC_DEMO } from "@/lib/public-demo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminSession = { supabase: SupabaseClient<Database>; userId: string; email: string | null };

export type Viewer = { status: "signed-out" } | { status: "not-admin"; email: string | null } | { status: "admin"; session: AdminSession };

/*
 * Who is using the admin. The session is verified with Supabase Auth (getClaims checks the token's signature), and admin rights
 * come from the public.admin_users table through is_admin(), on every call: hiding a button is not access control.
 */
export async function getViewer(): Promise<Viewer> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return { status: "signed-out" };
  const email = typeof claims.email === "string" ? claims.email : null;
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError) throw new Error(`Could not check administrator access: ${adminError.message}`);
  return isAdmin ? { status: "admin", session: { supabase, userId: claims.sub, email } } : { status: "not-admin", email };
}

/** Every admin page and Server Action starts here. Anyone who is not a signed-in administrator is sent to the sign-in page. */
export async function requireAdmin(): Promise<AdminSession> {
  if (PUBLIC_DEMO) notFound();
  if (!isSupabaseConfigured()) redirect("/admin");
  const viewer = await getViewer();
  if (viewer.status !== "admin") redirect("/admin/login");
  return viewer.session;
}
