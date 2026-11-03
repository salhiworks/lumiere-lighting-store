"use client";

import { useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import { ProductGrid } from "@/components/product/product-grid";
import { isSortValue, SORT_OPTIONS, sortProducts, type SortValue } from "@/lib/catalog/helpers";
import type { Collection, Product } from "@/lib/catalog/types";
import { useDemoProducts } from "@/lib/demo-admin/use-demo-catalog";

type ShopBrowserProps = { products: Product[]; collections: Collection[] };

/*
 * Filter and sort live in the URL (/shop?collection=glass&sort=price-asc), so every view can be shared and reloaded. Changes go
 * through history.replaceState, which Next.js syncs with useSearchParams: the grid updates instantly, without a server round trip.
 */
export function ShopBrowser({ products: catalog, collections: allCollections }: ShopBrowserProps) {
  // In the public demo the visitor's Demo Admin edits are applied here; everywhere else both lists pass through unchanged.
  const products = useDemoProducts(catalog);
  const collections = allCollections.filter((item) => products.some((product) => product.collection === item.id));
  const searchParams = useSearchParams();
  const collectionParam = searchParams.get("collection");
  const sortParam = searchParams.get("sort");
  const collection = collections.some((item) => item.id === collectionParam) ? collectionParam : null;
  const sort: SortValue = isSortValue(sortParam) ? sortParam : "featured";
  const visible = sortProducts(collection ? products.filter((product) => product.collection === collection) : products, sort);

  const update = (key: "collection" | "sort", value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  };

  const filters = [{ id: null, name: "All", count: products.length }, ...collections.map((item) => ({ id: item.id, name: item.name, count: products.filter((product) => product.collection === item.id).length }))];

  return (
    <>
      <div className="flex flex-col gap-5 py-6 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter by collection" className="-mx-1 flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active = filter.id === collection;
            return (
              <button
                key={filter.name}
                type="button"
                aria-pressed={active}
                onClick={() => update("collection", filter.id)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
                  active ? "border-foreground bg-foreground text-background" : "border-foreground/20 text-foreground/80 hover:border-foreground/45 hover:text-foreground",
                )}
              >
                {filter.name}
                <span className={cn("tabular-nums", active ? "text-background/65" : "text-muted-foreground")}>{filter.count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-6 lg:justify-end">
          <p aria-live="polite" className="text-[13px] text-muted-foreground">
            {visible.length} {visible.length === 1 ? "pendant" : "pendants"}
          </p>
          <label className="relative inline-flex items-center gap-3 text-[13px] text-muted-foreground">
            Sort
            <span className="relative">
              <select
                value={sort}
                onChange={(event) => update("sort", event.currentTarget.value === "featured" ? null : event.currentTarget.value)}
                className="h-9 cursor-pointer appearance-none rounded-full border border-foreground/20 bg-transparent pl-4 pr-9 text-[13px] font-medium text-foreground outline-none transition-colors hover:border-foreground/45 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-foreground/60" aria-hidden="true" />
            </span>
          </label>
        </div>
      </div>
      <ProductGrid products={visible} eagerCount={4} className="mt-4" />
    </>
  );
}
