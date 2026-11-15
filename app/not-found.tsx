import { DemoNotFound } from "@/components/demo-admin/demo-not-found";
import { NotFoundContent } from "@/components/layout/not-found-content";
import { StoreShell } from "@/components/layout/store-shell";
import { PUBLIC_DEMO } from "@/lib/public-demo";

/* Unknown URLs (and unknown or hidden products, which proxy.ts sends here) render outside the (store) layout, so the page brings
   the storefront frame itself. In the public demo it is also the fallback for a visitor-made product whose address cookie is missing
   (blocked cookies): the product is still drawn from localStorage, only with a 404 status. */
export default function NotFound() {
  return (
    <StoreShell>
      {PUBLIC_DEMO ? (
        <>
          <DemoNotFound mode="fallback" fallback={<NotFoundContent />} />
        </>
      ) : (
        <NotFoundContent />
      )}
    </StoreShell>
  );
}
