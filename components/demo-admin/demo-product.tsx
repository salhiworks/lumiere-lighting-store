"use client";

import { ProductDetail, relatedProducts } from "@/components/product/product-detail";
import ProductNotFound from "@/app/(store)/shop/[slug]/not-found";
import type { Collection, Product } from "@/lib/catalog/types";
import { useDemoProducts } from "@/lib/demo-admin/use-demo-catalog";

/* The public demo's product page with the visitor's Demo Admin edits applied. A pendant hidden in the dashboard shows the store's not-found view. */
export function DemoProduct({ slug, products, collections }: { slug: string; products: Product[]; collections: Collection[] }) {
  const shown = useDemoProducts(products);
  const product = shown.find((item) => item.slug === slug);
  if (!product) return <ProductNotFound />;
  const collection = collections.find((item) => item.id === product.collection) ?? { id: product.collection, name: "Collection", description: "" };
  return <ProductDetail product={product} collection={collection} related={relatedProducts(product, shown)} />;
}
