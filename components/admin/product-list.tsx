"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "cn";
import { LampImage } from "@/components/product/lamp-image";
import { getStockStatus } from "@/lib/catalog/helpers";
import type { AdminProduct, Collection } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { controlClass } from "./form-controls";

/* Fixed time zone, so the server render and the browser agree on every date. */
const updatedFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

type ProductListProps = {
  products: AdminProduct[];
  collections: Collection[];
  /** Where a product's edit page lives: the real admin and the public demo dashboard each have their own. */
  productHref: (product: AdminProduct) => string;
  /** The row's action (hide or publish), supplied by whoever owns the data. */
  renderAction: (product: AdminProduct, title: string) => React.ReactNode;
};

type StatusFilter = "all" | "visible" | "hidden" | "low";

const STATUS: { value: StatusFilter; label: string; test: (product: AdminProduct) => boolean }[] = [
  { value: "all", label: "All", test: () => true },
  { value: "visible", label: "Visible", test: (product) => product.published },
  { value: "hidden", label: "Hidden", test: (product) => !product.published },
  { value: "low", label: "Low stock", test: (product) => product.stock <= 5 },
];

/*
 * The product list the real admin and the public Demo Admin Dashboard share: search, filters for visibility, stock and collection,
 * and one row per pendant with its photo (hover or focus a row to see it lit), price, stock and visibility.
 */
export function ProductList({ products, collections, productHref, renderAction }: ProductListProps) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [collection, setCollection] = React.useState("");
  const names = new Map(collections.map((item) => [item.id, item.name]));
  const needle = query.trim().toLowerCase();
  const statusTest = STATUS.find((item) => item.value === status)?.test ?? (() => true);
  const visible = products.filter(
    (product) =>
      statusTest(product) &&
      (!collection || product.collection === collection) &&
      (!needle || [product.name, product.finish, product.slug, names.get(product.collection) ?? ""].some((value) => value.toLowerCase().includes(needle))),
  );
  const filtered = Boolean(needle || status !== "all" || collection);

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id="product-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search name, finish or URL"
            className={cn(controlClass, "h-10 rounded-full pl-10")}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Filter by status" className="inline-flex rounded-full border border-foreground/15 p-0.5">
            {STATUS.map((item) => {
              const count = products.filter(item.test).length;
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={status === item.value}
                  onClick={() => setStatus(item.value)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                    status === item.value ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground",
                  )}
                >
                  {item.label}
                  <span className={cn("tabular-nums", status === item.value ? "text-background/60" : "text-muted-foreground")}>{count}</span>
                </button>
              );
            })}
          </div>
          <label className="relative">
            <span className="sr-only">Filter by collection</span>
            <select
              value={collection}
              onChange={(event) => setCollection(event.currentTarget.value)}
              className="h-9 cursor-pointer appearance-none rounded-full border border-foreground/15 bg-transparent pl-4 pr-9 text-[12.5px] font-medium outline-none hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All collections</option>
              {collections.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-foreground/60" aria-hidden="true" />
          </label>
        </div>
      </div>
      <p aria-live="polite" className="mt-4 text-[13px] text-muted-foreground">
        {filtered ? `${visible.length} of ${products.length} products shown.` : `${products.length} products.`}
      </p>

      <ul className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
        <li aria-hidden="true" className="hidden grid-cols-[4.5rem_minmax(0,2.2fr)_minmax(0,1fr)_5.5rem_7rem_7rem_6rem] gap-x-4 border-b border-border bg-secondary/50 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground md:grid">
          <span />
          <span>Pendant</span>
          <span>Collection</span>
          <span>Price</span>
          <span>Stock</span>
          <span>Store</span>
          <span />
        </li>
        {visible.map((product) => {
          const stock = getStockStatus(product);
          const title = `${product.name} · ${product.finish}`;
          return (
            <li
              key={product.id}
              className="group grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-secondary/40 has-[a:focus-visible]:bg-secondary/40 motion-reduce:transition-none md:grid-cols-[4.5rem_minmax(0,2.2fr)_minmax(0,1fr)_5.5rem_7rem_7rem_6rem]"
            >
              <span className="relative block h-[4.5rem] w-14 overflow-hidden rounded-lg bg-secondary md:h-[5.5rem] md:w-[4.5rem]">
                <span aria-hidden="true" className="light-pool absolute inset-x-[-30%] top-[45%] h-[70%] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-has-[a:focus-visible]:opacity-100 motion-reduce:transition-none" />
                <LampImage product={product} lit="hover" fit="cover" className="inset-0" />
              </span>
              <div className="min-w-0">
                <Link
                  href={productHref(product)}
                  className="font-display text-[1.05rem] leading-tight underline-offset-4 outline-none hover:underline focus-visible:underline md:text-[1.15rem]"
                >
                  {title}
                </Link>
                <p className="mt-0.5 hidden truncate font-mono text-[12px] text-muted-foreground sm:block">/shop/{product.slug}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-muted-foreground md:hidden">
                  {formatPrice(product.priceCents, product.currency)} · <StockText product={product} /> ·{" "}
                  <span className={cn("font-medium", product.published ? "text-[oklch(0.42_0.09_150)]" : "text-muted-foreground")}>{product.published ? "Visible" : "Hidden"}</span>
                </p>
              </div>
              <span className="hidden text-[13px] text-muted-foreground md:block">{names.get(product.collection) ?? product.collection}</span>
              <span className="hidden text-sm tabular-nums md:block">{formatPrice(product.priceCents, product.currency)}</span>
              <span className="hidden md:block">
                <StockText product={product} />
                {stock.tone === "in" && <StockMeter stock={product.stock} />}
              </span>
              <span className="hidden flex-col text-[12.5px] md:flex">
                <VisibilityPill published={product.published} />
                <span className="mt-1 text-muted-foreground">{updatedFormat.format(new Date(product.updatedAt))}</span>
              </span>
              <div className="flex items-center justify-end">{renderAction(product, title)}</div>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="px-6 py-14 text-center text-sm text-muted-foreground">
            No products match{needle ? ` “${query.trim()}”` : " these filters"}.{" "}
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatus("all");
                setCollection("");
              }}
              className="font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear the filters
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

function StockText({ product }: { product: AdminProduct }) {
  const stock = getStockStatus(product);
  return (
    <span className={cn("text-[13px] tabular-nums", stock.tone === "low" && "font-medium text-brass-deep", stock.tone === "out" && "font-medium text-destructive")}>
      {stock.tone === "in" ? `${product.stock} in stock` : stock.label}
    </span>
  );
}

/* A hairline gauge for healthy stock, so a column of numbers reads at a glance (full at 20 or more). */
function StockMeter({ stock }: { stock: number }) {
  return (
    <span aria-hidden="true" className="mt-1.5 block h-[3px] w-16 overflow-hidden rounded-full bg-secondary">
      <span className="block h-full rounded-full bg-foreground/35" style={{ width: `${Math.min(100, (stock / 20) * 100)}%` }} />
    </span>
  );
}

function VisibilityPill({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium",
        published ? "bg-[oklch(0.62_0.09_150)]/12 text-[oklch(0.42_0.09_150)]" : "bg-secondary text-muted-foreground",
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", published ? "bg-[oklch(0.62_0.09_150)]" : "bg-muted-foreground/50")} />
      {published ? "Visible" : "Hidden"}
    </span>
  );
}
