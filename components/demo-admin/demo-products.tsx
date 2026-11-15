"use client";

import { ProductList } from "@/components/admin/product-list";
import { ProductsHeader } from "@/components/admin/products-header";
import { demoAdminCollections, demoAdminProducts } from "@/lib/demo-admin/catalog";
import { demoStore } from "@/lib/demo-admin/store";
import { useDemoEdits } from "@/lib/demo-admin/use-demo-catalog";
import { DemoBanner } from "./demo-banner";

/* Products: the real admin's list, over the sample pendants, this browser's edits and the visitor's own products. Hide or publish works at once, and the store follows. */
export function DemoProducts() {
  const edits = useDemoEdits();
  const products = demoAdminProducts(edits);
  const hidden = products.filter((product) => !product.published).length;
  const low = products.filter((product) => product.published && product.stock <= 5).length;
  return (
    <>
      <ProductsHeader visible={products.length - hidden} hidden={hidden} low={low} newHref="/demo/admin/products/new" note={<DemoBanner />} />
      <ProductList
        products={products}
        collections={demoAdminCollections}
        productHref={(product) => `/demo/admin/products/${product.id}`}
        renderAction={(product, title) => (
          <button
            type="button"
            onClick={() => demoStore.patchProduct(product.id, { published: !product.published })}
            aria-label={`${product.published ? "Hide" : "Publish"} ${title}`}
            className="h-8 rounded-full border border-foreground/20 px-3 text-[12.5px] font-medium outline-none transition-colors hover:border-foreground/45 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
          >
            {product.published ? "Hide" : "Publish"}
          </button>
        )}
      />
    </>
  );
}
