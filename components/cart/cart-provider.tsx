"use client";

import * as React from "react";
import type { CartProduct } from "@/lib/catalog/types";
import type { CheckoutNotice } from "@/lib/checkout/config";
import { useDemoProducts } from "@/lib/demo-admin/use-demo-catalog";
import { CartContext } from "./cart-context";
import { CartDrawer } from "./cart-drawer";

export { useCartCatalog, useCartDrawer } from "./cart-context";

/*
 * Holds the drawer's open state for the whole storefront, renders the drawer once next to the page, and hands the browser the
 * catalog snapshot the store layout loaded on the server.
 */
export function CartProvider({ catalog: serverCatalog, checkout, children }: { catalog: CartProduct[]; checkout: CheckoutNotice; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  // The public demo shows the visitor's Demo Admin prices, stock and visibility in the cart too; elsewhere this is the server's catalog.
  const catalog = useDemoProducts(serverCatalog);

  /* Browser back or forward while the drawer is open: close it along with the page it was opened on. */
  React.useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);

  const byId = React.useMemo(() => new Map(catalog.map((product) => [product.id, product])), [catalog]);
  const value = React.useMemo(() => ({ open, setOpen, catalog: byId, checkout }), [open, byId, checkout]);
  return (
    <CartContext value={value}>
      {children}
      <CartDrawer open={open} onOpenChange={setOpen} />
    </CartContext>
  );
}
