"use client";

import type { AdminProduct, Collection } from "@/lib/catalog/types";
import { ProductList } from "./product-list";
import { VisibilityButton } from "./visibility-button";

/* The real admin's product list: rows link to /admin/products/<id>, and the action is the Server Action behind VisibilityButton. */
export function ProductTable({ products, collections }: { products: AdminProduct[]; collections: Collection[] }) {
  return (
    <ProductList
      products={products}
      collections={collections}
      productHref={(product) => `/admin/products/${product.id}`}
      renderAction={(product, title) => <VisibilityButton productId={product.id} published={product.published} title={title} />}
    />
  );
}
