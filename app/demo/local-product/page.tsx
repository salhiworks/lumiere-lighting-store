import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoNotFound } from "@/components/demo-admin/demo-not-found";
import { NotFoundContent } from "@/components/layout/not-found-content";
import { StoreShell } from "@/components/layout/store-shell";
import { PUBLIC_DEMO } from "@/lib/public-demo";

export const metadata: Metadata = { title: "Pendant", robots: { index: false, follow: false } };

/*
 * Public demo only. proxy.ts rewrites /shop/<slug> here when the slug belongs to a product the visitor created in the Demo Admin
 * (their browser lists it in a cookie), so the address answers with HTTP 200 and survives a refresh. The page is a static frame:
 * the product itself is read from the visitor's localStorage once in the browser. Requested directly, this path is a 404.
 */
export default function DemoLocalProductPage() {
  if (!PUBLIC_DEMO) notFound();
  return (
    <StoreShell>
      <DemoNotFound mode="product" fallback={<NotFoundContent />} />
      {/* Without JavaScript the product can't be read from the browser: say so instead of showing a skeleton forever. */}
      <noscript>
        <style>{"[data-product-skeleton]{display:none}"}</style>
        <NotFoundContent />
      </noscript>
    </StoreShell>
  );
}
