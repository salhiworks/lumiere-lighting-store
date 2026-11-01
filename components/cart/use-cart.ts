"use client";

import * as React from "react";
import { cartStore } from "@/lib/cart";
import { maxQuantity } from "@/lib/catalog/helpers";
import type { CartProduct } from "@/lib/catalog/types";
import { useCartCatalog } from "./cart-context";

export type CartItem = { product: CartProduct; quantity: number; max: number; lineTotalCents: number };
/** A saved line whose product is hidden, removed or sold out. It stays visible so the visitor can see why and remove it. */
export type UnavailableLine = { productId: string; quantity: number; product: CartProduct | null };

const subscribeNever = () => () => {};

/* Cart lines joined with the live catalog. Reads localStorage through useSyncExternalStore, so hydration always matches the server. */
export function useCart() {
  const lines = React.useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  /* False on the server and during hydration, true after: lets the UI hold a neutral state instead of claiming the cart is empty. */
  const ready = React.useSyncExternalStore(subscribeNever, () => true, () => false);
  const catalog = useCartCatalog();

  const { items, unavailable } = React.useMemo(() => {
    const items: CartItem[] = [];
    const unavailable: UnavailableLine[] = [];
    for (const line of lines) {
      const product = catalog.get(line.productId) ?? null;
      const max = product ? maxQuantity(product) : 0;
      if (!product || max === 0) {
        unavailable.push({ productId: line.productId, quantity: line.quantity, product });
        continue;
      }
      const quantity = Math.min(line.quantity, max);
      items.push({ product, quantity, max, lineTotalCents: product.priceCents * quantity });
    }
    return { items, unavailable };
  }, [lines, catalog]);

  return {
    ready,
    items,
    unavailable,
    count: items.reduce((total, item) => total + item.quantity, 0),
    subtotalCents: items.reduce((total, item) => total + item.lineTotalCents, 0),
    /** The store sells in one currency; the first item's tells the totals how to format. */
    currency: items[0]?.product.currency ?? "USD",
    add: (product: CartProduct, quantity = 1) => cartStore.add(product.id, quantity, maxQuantity(product)),
    setQuantity: (product: CartProduct, quantity: number) => cartStore.setQuantity(product.id, quantity, maxQuantity(product)),
    remove: (productId: string) => cartStore.remove(productId),
  };
}
