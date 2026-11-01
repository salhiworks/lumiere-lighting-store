import type { PendantLamp } from "@/components/ui/pendant-lamp-rail";
import { formatPrice } from "@/lib/format";
import type { Product } from "./types";

/*
 * Pure catalog helpers, safe in both Server and Client Components. Data access lives in ./index.ts (server only).
 */

const LOW_STOCK = 5;
const MAX_PER_ORDER = 10;

/** "Enamel dome · Forest": the name used on the rail, in the cart and in page titles. */
export function productTitle(product: Pick<Product, "name" | "finish">): string {
  return `${product.name} · ${product.finish}`;
}

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "name", label: "Name, A to Z" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function isSortValue(value: unknown): value is SortValue {
  return SORT_OPTIONS.some((option) => option.value === value);
}

/** "featured" keeps the catalog's own order. */
export function sortProducts(list: Product[], sort: SortValue): Product[] {
  const sorted = [...list];
  if (sort === "price-asc") sorted.sort((a, b) => a.priceCents - b.priceCents);
  else if (sort === "price-desc") sorted.sort((a, b) => b.priceCents - a.priceCents);
  else if (sort === "name") sorted.sort((a, b) => productTitle(a).localeCompare(productTitle(b), "en"));
  return sorted;
}

export type StockStatus = { tone: "in" | "low" | "out"; label: string };

export function getStockStatus(product: Pick<Product, "stock">): StockStatus {
  if (product.stock <= 0) return { tone: "out", label: "Sold out" };
  if (product.stock <= LOW_STOCK) return { tone: "low", label: `Only ${product.stock} left` };
  return { tone: "in", label: "In stock" };
}

/** Most of one product a single cart can hold. */
export function maxQuantity(product: Pick<Product, "stock">): number {
  return Math.max(0, Math.min(product.stock, MAX_PER_ORDER));
}

/** Maps a product onto the Pendant Lamp Rail's item shape, so the rail and the shop can never disagree. */
export function toPendantLamp(product: Product): PendantLamp {
  return {
    id: product.id,
    name: productTitle(product),
    description: product.summary,
    image: product.images.off,
    imageOn: product.images.on,
    drop: product.drop,
    tag: formatPrice(product.priceCents, product.currency),
    details: product.highlights,
  };
}

/** Facts computed from the catalog itself, for the studio section. */
export function catalogFacts(products: Product[]) {
  const diameters = products.map((product) => product.diameterCm);
  const cheapest = products.reduce<Product | null>((low, product) => (!low || product.priceCents < low.priceCents ? product : low), null);
  return {
    count: products.length,
    minDiameter: diameters.length ? Math.min(...diameters) : 0,
    maxDiameter: diameters.length ? Math.max(...diameters) : 0,
    fromPrice: cheapest ? formatPrice(cheapest.priceCents, cheapest.currency) : null,
  };
}
