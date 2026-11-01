import { CartProvider } from "@/components/cart/cart-provider";
import { getCartCatalog, getCatalogMode, getCollectionsWithProducts } from "@/lib/catalog";
import { getCheckoutNotice } from "@/lib/checkout/config";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/* The storefront frame: header, footer and cart. It hands the cart the catalog snapshot and the checkout status it needs. */
export async function StoreShell({ children }: { children: React.ReactNode }) {
  const [catalog, collections] = await Promise.all([getCartCatalog(), getCollectionsWithProducts()]);
  return (
    <CartProvider catalog={catalog} checkout={getCheckoutNotice()}>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter collections={collections.map((entry) => entry.collection)} demoCatalog={getCatalogMode() === "demo"} />
    </CartProvider>
  );
}
