"use client";

import * as React from "react";
import { useCartDrawer } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useCart } from "@/components/cart/use-cart";
import { Button } from "@/components/ui/button";
import { maxQuantity, productTitle } from "@/lib/catalog/helpers";
import type { Product } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";

/* Quantity and add to cart for the product page. Adding opens the cart drawer, so the result is visible straight away. */
export function AddToCart({ product }: { product: Product }) {
  const { ready, items, add } = useCart();
  const { openCart } = useCartDrawer();
  const [quantity, setQuantity] = React.useState(1);

  const max = maxQuantity(product);
  if (max === 0) {
    return (
      <Button size="lg" disabled className="w-full sm:w-auto">
        Sold out
      </Button>
    );
  }

  const inCart = items.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const room = Math.max(0, max - inCart);
  const value = Math.min(quantity, Math.max(1, room));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper value={value} max={Math.max(1, room)} onChange={setQuantity} label={`Quantity, ${productTitle(product)}`} className="h-12" />
        <Button
          size="lg"
          className="min-w-0 flex-1 sm:min-w-60 sm:flex-none"
          disabled={room === 0}
          onClick={() => {
            if (add(product, value) > 0) {
              setQuantity(1);
              openCart();
            }
          }}
        >
          {room === 0 ? "Limit reached" : `Add to cart · ${formatPrice(product.priceCents * value, product.currency)}`}
        </Button>
      </div>
      <p className="mt-3 min-h-5 text-[13px] text-muted-foreground">
        {ready && inCart > 0 ? `${inCart} already in your cart${room === 0 ? ", the most one order can hold." : "."}` : ""}
      </p>
    </div>
  );
}
