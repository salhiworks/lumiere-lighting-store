"use client";

import { useDemoProducts } from "@/lib/demo-admin/use-demo-catalog";
import type { Product } from "@/lib/catalog/types";
import { countWord } from "@/lib/format";

/* The shop header's one-line count, kept in step with the visitor's Demo Admin edits in the public demo. */
export function ShopIntro({ products, collectionIds }: { products: Product[]; collectionIds: string[] }) {
  const shown = useDemoProducts(products);
  const collections = new Set(shown.map((product) => product.collection));
  const count = collectionIds.filter((id) => collections.has(id)).length;
  return (
    <p className="max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
      {countWord(shown.length)} designs in {count} collections. Each pendant ships with its LED lamp and a 1.5 m fabric cord.
    </p>
  );
}
