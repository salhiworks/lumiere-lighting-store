import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudioShell } from "@/components/admin/studio-shell";
import { DemoResetControl } from "@/components/demo-admin/demo-admin-header";
import { PUBLIC_DEMO } from "@/lib/public-demo";

export const metadata: Metadata = {
  title: { default: "Demo admin", template: "%s · LUMIÈRE demo admin" },
  robots: { index: false, follow: false },
};

/*
 * The Demo Admin Dashboard exists only in the public demo build (npm run build:demo). It has no sign-in because it has nothing to
 * protect: no database, no accounts, no customers. Its data is the built-in sample catalog plus edits kept in the visitor's own browser.
 * Anywhere else, proxy.ts answers 404 first and this layout is the second lock. It shares the real admin's studio shell.
 */
export default function DemoAdminLayout({ children }: { children: React.ReactNode }) {
  if (!PUBLIC_DEMO) notFound();
  return (
    <StudioShell base="/demo/admin" badge="Demo studio" note="A working copy of the admin. Changes stay in this browser; there’s no sign-in, database or payment." account={<DemoResetControl />}>
      {children}
    </StudioShell>
  );
}
