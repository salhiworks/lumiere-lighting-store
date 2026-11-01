import Link from "next/link";
import { cn } from "cn";
import { getStockStatus } from "@/lib/catalog/helpers";
import type { Product } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { HangingLamp } from "./hanging-lamp";
import { LampImage } from "./lamp-image";

/* A pendant hanging from the grid's ceiling rule. Hover or focus switches it on with its paired lit photo and a pool of light. */
export function ProductCard({ product, eager = false }: { product: Product; eager?: boolean }) {
  const stock = getStockStatus(product);
  return (
    <Link
      href={`/shop/${product.slug}`}
      prefetch
      className="group block rounded-sm px-3 pb-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:px-5"
    >
      <span className="relative block aspect-[4/5] overflow-hidden">
        <span aria-hidden="true" className="ceiling-canopy absolute left-1/2 top-0 z-10 -translate-x-1/2" />
        <span aria-hidden="true" className="light-pool absolute left-1/2 top-[58%] h-[42%] w-full -translate-x-1/2 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
        <HangingLamp>
          <LampImage product={product} lit="hover" eager={eager} className="left-[6%] top-0 w-[88%]" />
        </HangingLamp>
      </span>
      <span className="mt-4 block font-display text-xl leading-tight tracking-[-0.01em] sm:text-[1.375rem]">{product.name}</span>
      <span className="mt-1 flex items-baseline justify-between gap-3 text-[13px]">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 text-muted-foreground">
          {product.finish}
          {stock.tone !== "in" && (
            <>
              <span aria-hidden="true">·</span>
              <span className={cn(stock.tone === "low" && "text-brass-deep")}>{stock.label}</span>
            </>
          )}
        </span>
        <span className="text-sm tabular-nums text-foreground">{formatPrice(product.priceCents, product.currency)}</span>
      </span>
    </Link>
  );
}
