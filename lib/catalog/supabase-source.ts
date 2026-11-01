import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { AdminProduct, Collection, Product, ProductSpec } from "./types";

/*
 * Reading the catalog from Supabase. Everything Supabase-specific (table and column names, error codes) stays in this file;
 * the rest of the app only sees the Product and Collection shapes from ./types.
 */

type Client = SupabaseClient<Database>;
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export const PRODUCT_COLUMNS =
  "id, slug, name, finish, collection_id, price_cents, currency, stock, diameter_cm, summary, description, highlights, specs, image_off, image_on, image_alt, image_width, image_height, cord_drop, is_published, sort_order, created_at, updated_at";

export class CatalogError extends Error {
  name = "CatalogError";
}

type PostgrestErrorLike = { message: string; code?: string };

/** Turns a Supabase error into a message that says what to fix. */
export function catalogFailure(action: string, error: PostgrestErrorLike): CatalogError {
  const text = error.message || "unknown error";
  let hint = "";
  if (error.code === "42P01" || error.code === "PGRST205" || /does not exist|Could not find the table/i.test(text)) {
    hint = " The catalog tables are missing: run supabase/migrations/*.sql and supabase/seed.sql in your project (see README).";
  } else if (/Invalid API key|No API key|JWT|apikey/i.test(text) || error.code === "PGRST301") {
    hint = " Check NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";
  } else if (/fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(text)) {
    hint = " Check NEXT_PUBLIC_SUPABASE_URL and that the project is running.";
  }
  return new CatalogError(`Could not ${action} from Supabase: ${text}.${hint}`);
}

function parseSpecs(value: Json): ProductSpec[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const { label, value: text } = entry as { label?: unknown; value?: unknown };
    return typeof label === "string" && typeof text === "string" ? [{ label, value: text }] : [];
  });
}

export function productFromRow(row: ProductRow): AdminProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    finish: row.finish,
    collection: row.collection_id,
    priceCents: row.price_cents,
    currency: row.currency,
    stock: row.stock,
    diameterCm: Number(row.diameter_cm),
    summary: row.summary,
    description: row.description,
    highlights: row.highlights ?? [],
    specs: parseSpecs(row.specs),
    images: { off: row.image_off, on: row.image_on, alt: row.image_alt, width: row.image_width, height: row.image_height },
    drop: Number(row.cord_drop),
    published: row.is_published,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* The storefront's copy of a product: the admin-only fields are left out of caches and page payloads. */
function publicProduct(product: AdminProduct): Product {
  const { id, slug, name, finish, collection, priceCents, currency, stock, diameterCm, summary, description, highlights, specs, images, drop, published } = product;
  return { id, slug, name, finish, collection, priceCents, currency, stock, diameterCm, summary, description, highlights, specs, images, drop, published };
}

export async function fetchPublishedProducts(client: Client = createSupabasePublicClient()): Promise<Product[]> {
  const { data, error } = await client
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_published", true)
    .order("sort_order")
    .order("name");
  if (error) throw catalogFailure("load products", error);
  return data.map((row) => publicProduct(productFromRow(row)));
}

export async function fetchCollections(client: Client = createSupabasePublicClient()): Promise<Collection[]> {
  const { data, error } = await client.from("collections").select("id, name, description").order("sort_order").order("name");
  if (error) throw catalogFailure("load collections", error);
  return data;
}
