"use client";

import * as React from "react";
import { HomeBody } from "@/components/home/home-body";
import { useDemoProducts } from "@/lib/demo-admin/use-demo-catalog";
import type { Collection, Product } from "@/lib/catalog/types";

/*
 * The public demo's homepage: the same content as the real one, with the visitor's Demo Admin edits applied after hydration.
 * The rail is remounted when a photo, price or visibility changed, so it starts clean with the new lamps and its physics, dimmer
 * and lighting run unchanged; an unedited demo keeps one stable rail.
 */
export function DemoHome({ products, collections }: { products: Product[]; collections: Collection[] }) {
  const shown = useDemoProducts(products);
  const entries = React.useMemo(
    () => collections.map((collection) => ({ collection, products: shown.filter((product) => product.collection === collection.id) })).filter((entry) => entry.products.length > 0),
    [collections, shown],
  );
  const signature = shown.map((product) => `${product.id}:${product.images.off.length}:${product.images.on.length}:${product.drop}:${product.priceCents}:${product.name}:${product.finish}`).join("|");
  return <HomeBody key={signature} products={shown} collections={entries} />;
}
