import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/admin-header";
import { LoginForm } from "@/components/admin/login-form";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/admin/auth";
import { safeAdminPath } from "@/lib/admin/paths";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (!isSupabaseConfigured()) redirect("/admin");
  const [viewer, { next }] = await Promise.all([getViewer(), searchParams]);
  if (viewer.status === "admin") redirect(safeAdminPath(next));

  return (
    <>
      <AdminHeader />
      <main id="main" tabIndex={-1} className="flex flex-1 items-start justify-center px-5 py-16 outline-none sm:items-center sm:py-24">
        <div className="w-full max-w-sm">
          {viewer.status === "not-admin" ? (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="font-display text-[2.4rem] font-light leading-none tracking-[-0.02em]">No admin access</h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  You’re signed in as <strong className="font-medium text-foreground">{viewer.email ?? "this account"}</strong>, which isn’t an
                  administrator. Ask the store owner to add it (docs/ADMIN.md, “Create your administrator”), or sign in with another account.
                </p>
              </div>
              <form action={signOut}>
                <Button type="submit" size="lg" variant="outline" className="w-full">
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <LoginForm next={typeof next === "string" ? safeAdminPath(next) : undefined} />
          )}
        </div>
      </main>
    </>
  );
}
