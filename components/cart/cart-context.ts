"use client";

import * as React from "react";
import type { CartProduct } from "@/lib/catalog/types";
import type { CheckoutNotice } from "@/lib/checkout/config";

export type CartContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Published products by ID, from the server's catalog: the only source of names, prices and stock in the browser. */
  catalog: ReadonlyMap<string, CartProduct>;
  /** Whether checkout is open on this server, and what to tell the visitor if not. */
  checkout: CheckoutNotice;
};

export const CartContext = React.createContext<CartContextValue | null>(null);

function useCartContext(hook: string) {
  const context = React.use(CartContext);
  if (!context) throw new Error(`${hook} must be used inside <CartProvider>.`);
  return context;
}

export function useCartDrawer() {
  const { open, setOpen } = useCartContext("useCartDrawer");
  return React.useMemo(() => ({ open, openCart: () => setOpen(true), closeCart: () => setOpen(false) }), [open, setOpen]);
}

export function useCartCatalog(): ReadonlyMap<string, CartProduct> {
  return useCartContext("useCartCatalog").catalog;
}

export function useCheckoutNotice(): CheckoutNotice {
  return useCartContext("useCheckoutNotice").checkout;
}
