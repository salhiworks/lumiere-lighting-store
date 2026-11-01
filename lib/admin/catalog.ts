import "server-only";
import { catalogFailure, PRODUCT_COLUMNS, productFromRow } from "@/lib/catalog/supabase-source";
import type { AdminProduct, Collection } from "@/lib/catalog/types";
import type { AdminSession } from "./auth";

/* The admin's reads, made with the administrator's own session: they include hidden products and are never cached. */

export async function listAdminProducts({ supabase }: AdminSession): Promise<AdminProduct[]> {
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).order("sort_order").order("name");
  if (error) throw catalogFailure("load products", error);
  return data.map(productFromRow);
}

export async function getAdminProduct({ supabase }: AdminSession, id: string): Promise<AdminProduct | null> {
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw catalogFailure("load the product", error);
  return data ? productFromRow(data) : null;
}

export async function listAdminCollections({ supabase }: AdminSession): Promise<Collection[]> {
  const { data, error } = await supabase.from("collections").select("id, name, description").order("sort_order").order("name");
  if (error) throw catalogFailure("load collections", error);
  return data;
}
