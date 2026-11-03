import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoAdminHeader } from "@/components/demo-admin/demo-admin-header";
import { PUBLIC_DEMO } from "@/lib/public-demo";

export const metadata: Metadata = {
  title: { default: "Demo admin", template: "%s · LUMIÈRE demo admin" },
  robots: { index: false, follow: false },
};

/*
 * The Demo Admin Dashboard exists only in the public demo build (npm run build:demo). It has no sign-in because it has nothing to
 * protect: no database, no accounts, no customers. Its data is the built-in sample catalog plus edits kept in the visitor's own browser.
 * Anywhere else, proxy.ts answers 404 first and this layout is the second lock.
 */
export default function DemoAdminLayout({ children }: { children: React.ReactNode }) {
  if (!PUBLIC_DEMO) notFound();
  return (
    <div className="flex flex-1 flex-col">
      <DemoAdminHeader />
      <main id="main" tabIndex={-1} className="flex-1 pb-24 outline-none">
        <div className="shell">{children}</div>
      </main>
    </div>
  );
}
