"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "cn";
import { LampImage } from "@/components/product/lamp-image";
import { getStockStatus } from "@/lib/catalog/helpers";
import type { AdminProduct, Collection } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { controlClass } from "./form-controls";
import { VisibilityButton } from "./visibility-button";

/* Fixed time zone, so the server render and the browser agree on every date. */
const updatedFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function ProductTable({ products, collections }: { products: AdminProduct[]; collections: Collection[] }) {
  const [query, setQuery] = React.useState("");
  const names = new Map(collections.map((collection) => [collection.id, collection.name]));
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? products.filter((product) =>
        [product.name, product.finish, product.slug, names.get(product.collection) ?? ""].some((value) => value.toLowerCase().includes(needle)),
      )
    : products;

  return (
    <div className="mt-8">
      <div className="relative max-w-sm">
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id="product-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search by name, finish or collection"
          className={cn(controlClass, "h-10 pl-10")}
        />
      </div>
      <p aria-live="polite" className="mt-3 text-[13px] text-muted-foreground">
        {needle ? `${visible.length} of ${products.length} products match “${query.trim()}”.` : `${products.length} products.`}
      </p>

      <ul className="mt-4 border-t border-foreground/15">
        {visible.map((product) => {
          const stock = getStockStatus(product);
          const title = `${product.name} · ${product.finish}`;
          return (
            <li key={product.id} className="grid grid-cols-[4rem_1fr_auto] items-center gap-x-4 gap-y-2 border-b border-border py-4 md:grid-cols-[4rem_minmax(0,2.2fr)_1fr_6rem_7rem_6.5rem_auto]">
              <span className="relative block h-20 w-16 overflow-hidden rounded-md bg-secondary">
                <LampImage product={product} lit fit="cover" className="inset-0" />
              </span>
              <div className="min-w-0">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="font-display text-lg leading-tight underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {title}
                </Link>
                <p className="mt-0.5 truncate font-mono text-[12px] text-muted-foreground">/shop/{product.slug}</p>
                <p className="mt-1 text-[12.5px] text-muted-foreground md:hidden">
                  {formatPrice(product.priceCents, product.currency)} · {stock.tone === "in" ? `${product.stock} in stock` : stock.label}
                </p>
              </div>
              <span className="hidden text-[13px] text-muted-foreground md:block">{names.get(product.collection) ?? product.collection}</span>
              <span className="hidden text-sm tabular-nums md:block">{formatPrice(product.priceCents, product.currency)}</span>
              <span className={cn("hidden text-[13px] tabular-nums md:block", stock.tone === "low" && "text-brass-deep", stock.tone === "out" && "text-destructive")}>
                {stock.tone === "in" ? `${product.stock} in stock` : stock.label}
              </span>
              <span className="hidden flex-col text-[12.5px] md:flex">
                <span className={cn("inline-flex items-center gap-1.5 font-medium", product.published ? "text-foreground" : "text-muted-foreground")}>
                  <span aria-hidden="true" className={cn("size-1.5 rounded-full", product.published ? "bg-[oklch(0.62_0.09_150)]" : "bg-muted-foreground/50")} />
                  {product.published ? "Visible" : "Hidden"}
                </span>
                <span className="text-muted-foreground">{updatedFormat.format(new Date(product.updatedAt))}</span>
              </span>
              <div className="flex items-center justify-end gap-2">
                <span className={cn("text-[12px] md:hidden", product.published ? "text-foreground" : "text-muted-foreground")}>{product.published ? "Visible" : "Hidden"}</span>
                <VisibilityButton productId={product.id} published={product.published} title={title} />
              </div>
            </li>
          );
        })}
      </ul>
      {visible.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No products match “{query.trim()}”. Try a name, finish or collection.
        </p>
      )}
    </div>
  );
}
