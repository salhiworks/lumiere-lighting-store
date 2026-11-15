import { cn } from "cn";
import { getStockStatus } from "@/lib/catalog/helpers";
import type { Product } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { HangingLamp } from "./hanging-lamp";
import { LampImage } from "./lamp-image";
import { ProductLink } from "./product-link";

/*
 * A pendant hanging from the grid's ceiling rule. Hover or keyboard focus switches it on: the paired lit photo fades in, a pool of
 * light lands below it and the bay around it warms, the way a lamp lights the wall behind it.
 */
export function ProductCard({ product, eager = false }: { product: Product; eager?: boolean }) {
  const stock = getStockStatus(product);
  return (
    <ProductLink
      product={product}
      prefetch
      className="group relative block rounded-sm px-3 pb-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:px-5"
    >
      <span
        aria-hidden="true"
        className="room-glow pointer-events-none absolute inset-x-0 top-0 h-[78%] opacity-0 transition-opacity duration-700 group-hover:opacity-60 group-focus-visible:opacity-60 motion-reduce:transition-none"
      />
      <span className="relative block aspect-[4/5] overflow-hidden">
        <span aria-hidden="true" className="ceiling-canopy absolute left-1/2 top-0 z-10 -translate-x-1/2" />
        <span
          aria-hidden="true"
          className="light-pool absolute left-1/2 top-[58%] h-[42%] w-full -translate-x-1/2 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
        />
        <HangingLamp>
          <LampImage product={product} lit="hover" eager={eager} className="left-[6%] top-0 w-[88%]" />
        </HangingLamp>
      </span>
      <span className="relative mt-4 flex items-baseline justify-between gap-3">
        <span className="block font-display text-xl leading-tight tracking-[-0.01em] sm:text-[1.375rem]">{product.name}</span>
        <span className="text-sm tabular-nums text-foreground">{formatPrice(product.priceCents, product.currency)}</span>
      </span>
      <span className="relative mt-1 flex min-w-0 flex-wrap items-center gap-x-2 text-[13px] text-muted-foreground">
        {product.finish}
        {stock.tone !== "in" && (
          <>
            <span aria-hidden="true">·</span>
            <span className={cn(stock.tone === "low" && "text-brass-deep")}>{stock.label}</span>
          </>
        )}
      </span>
      {/* A thin brass line draws under the name as the lamp lights: the card's "on" state, also for keyboard focus. */}
      <span
        aria-hidden="true"
        className="relative mt-3 block h-px origin-left scale-x-0 bg-brass transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
      />
    </ProductLink>
  );
}
