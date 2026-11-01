"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useCartCatalog } from "@/components/cart/cart-provider";
import { useCart } from "@/components/cart/use-cart";
import { Button } from "@/components/ui/button";
import { getStockStatus, maxQuantity } from "@/lib/catalog/helpers";

type LampDetailActionsProps = {
  productId: string;
  /** Closes the lamp detail, then opens the cart drawer. */
  onViewCart: () => void;
};

/* Store actions rendered inside the rail's own detail view: add to cart without leaving it, or go to the full product page. */
export function LampDetailActions({ productId, onViewCart }: LampDetailActionsProps) {
  const { ready, items, add } = useCart();
  const catalog = useCartCatalog();
  const [justAdded, setJustAdded] = React.useState(false);

  React.useEffect(() => {
    if (!justAdded) return;
    const timer = window.setTimeout(() => setJustAdded(false), 1800);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  const product = catalog.get(productId);
  if (!product) return null;

  const max = maxQuantity(product);
  const inCart = items.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const full = inCart >= max;
  const status = !ready ? "" : inCart > 0 ? `${inCart} in your cart` : getStockStatus(product).label;

  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:justify-start">
        <Button
          onClick={() => {
            if (add(product) > 0) setJustAdded(true);
          }}
          disabled={max === 0 || full}
          className="min-w-40"
        >
          {max === 0 ? (
            "Sold out"
          ) : justAdded ? (
            <>
              <Check aria-hidden="true" /> Added to cart
            </>
          ) : full ? (
            "Limit reached"
          ) : (
            "Add to cart"
          )}
        </Button>
        <Link
          href={`/shop/${product.slug}`}
          className="group/link inline-flex items-center gap-1.5 rounded-sm text-sm font-medium underline decoration-foreground/25 underline-offset-[6px] outline-none transition-colors hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
        >
          View details
          <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
        </Link>
      </div>
      <div className="flex min-h-5 items-center gap-3 text-xs">
        <p aria-live="polite" className="text-muted-foreground">
          {status}
        </p>
        {ready && inCart > 0 && (
          <button
            type="button"
            onClick={onViewCart}
            className="rounded-sm font-medium underline decoration-foreground/25 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            View cart
          </button>
        )}
      </div>
    </div>
  );
}
