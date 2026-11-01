import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PUBLIC_DEMO } from "@/lib/public-demo";

/* Admin pages read the visitor's session on every request, so they are allowed to wait for it instead of serving a static shell. */
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · LUMIÈRE admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // The public demo has no admin at all (proxy.ts answers 404 first; this is the second lock).
  if (PUBLIC_DEMO) notFound();
  return <div className="flex flex-1 flex-col">{children}</div>;
}
