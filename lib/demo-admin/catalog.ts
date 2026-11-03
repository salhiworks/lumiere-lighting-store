import { demoCollections, demoProducts } from "@/lib/catalog/demo-data";
import type { AdminProduct } from "@/lib/catalog/types";
import { applyEdits, type DemoState } from "./store";

/* The dashboard's view of the built-in catalog with the visitor's edits applied. Hidden products stay in the list, as in the real admin. */
const SAMPLE_DATE = "2026-11-01T00:00:00Z";

const base: AdminProduct[] = demoProducts.map((product, index) => ({ ...product, sortOrder: index, createdAt: SAMPLE_DATE, updatedAt: SAMPLE_DATE }));

export const demoAdminCollections = demoCollections;
export const demoProductIds = demoProducts.map((product) => product.id);

export function demoAdminProducts(edits: DemoState): AdminProduct[] {
  return applyEdits(base, edits).map((product) => ({ ...product, published: edits.products[product.id]?.published ?? product.published }));
}
