import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { demoCollections, demoProducts } from "./demo-data";
import { fetchCollections, fetchPublishedProducts } from "./supabase-source";
import type { CartProduct, Collection, Product } from "./types";

export type { AdminProduct, CartProduct, Collection, Product, ProductImages, ProductSpec } from "./types";

/*
 * The one place the storefront reads catalog data from (server only; client components use ./helpers and ./types).
 *
 *   Demo mode:      Supabase is not configured, so the built-in catalog in ./demo-data.ts is served.
 *   Supabase mode:  published products and collections come from the database. If the database cannot be reached, these
 *                   functions throw a CatalogError; they never fall back to the demo products.
 *
 * Reads are cached under the "catalog" tag. Admin saves call updateTag("catalog"), so edits show up on the next request;
 * changes made directly in Supabase appear within about a minute.
 */

export const CATALOG_TAG = "catalog";

export type CatalogMode = "demo" | "supabase";

let announced = false;

export function getCatalogMode(): CatalogMode {
  const mode = getSupabaseConfig() ? "supabase" : "demo";
  if (mode === "demo" && !announced) {
    announced = true;
    console.info("LUMIÈRE: Supabase is not configured, so the store is serving the built-in demo catalog.");
  }
  return mode;
}

/** Published products in display order. */
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");
  return getCatalogMode() === "demo" ? demoProducts : fetchPublishedProducts();
}

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");
  return getCatalogMode() === "demo" ? demoCollections : fetchCollections();
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((product) => product.slug === slug);
}

/** Collections that have at least one published product, each with its products. */
export async function getCollectionsWithProducts(): Promise<{ collection: Collection; products: Product[] }[]> {
  const [collections, products] = await Promise.all([getCollections(), getProducts()]);
  return collections
    .map((collection) => ({ collection, products: products.filter((product) => product.collection === collection.id) }))
    .filter((entry) => entry.products.length > 0);
}

/** The slice of every published product the cart needs in the browser. */
export async function getCartCatalog(): Promise<CartProduct[]> {
  return (await getProducts()).map(({ id, slug, name, finish, priceCents, currency, stock, images }) => ({
    id,
    slug,
    name,
    finish,
    priceCents,
    currency,
    stock,
    images,
  }));
}
