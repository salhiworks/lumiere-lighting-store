"use client";

import * as React from "react";
import { CollectionsView } from "@/components/shop/collections-view";
import type { Collection, Product } from "@/lib/catalog/types";
import { useDemoProducts } from "@/lib/demo-admin/use-demo-catalog";

/* The public demo's collections page with the visitor's Demo Admin edits applied. */
export function DemoCollections({ collections, products }: { collections: Collection[]; products: Product[] }) {
  const shown = useDemoProducts(products);
  const entries = React.useMemo(
    () => collections.map((collection) => ({ collection, products: shown.filter((product) => product.collection === collection.id) })).filter((entry) => entry.products.length > 0),
    [collections, shown],
  );
  return <CollectionsView collections={entries} />;
}
