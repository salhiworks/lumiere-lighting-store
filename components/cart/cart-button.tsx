"use client";

import { ShoppingBag } from "lucide-react";
import { cn } from "cn";
import { useCartDrawer } from "./cart-provider";
import { useCart } from "./use-cart";

/* Header cart indicator. The count appears only after hydration, when the saved cart has been read. */
export function CartButton() {
  const { ready, count } = useCart();
  const { openCart } = useCartDrawer();
  const label = ready ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart";
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={label}
      aria-haspopup="dialog"
      className="relative inline-flex h-10 items-center gap-2 rounded-full pl-3 pr-3.5 text-sm font-medium outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
    >
      <ShoppingBag className="size-[18px]" strokeWidth={1.6} aria-hidden="true" />
      <span className="hidden sm:inline">Cart</span>
      <span
        aria-hidden="true"
        className={cn(
          "grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold leading-none text-background tabular-nums transition-[opacity,transform] duration-300 motion-reduce:transition-none",
          ready && count > 0 ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
      >
        {count}
      </span>
    </button>
  );
}
