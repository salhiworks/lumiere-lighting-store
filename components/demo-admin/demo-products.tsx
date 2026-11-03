"use client";

import { ProductList } from "@/components/admin/product-list";
import { DemoBanner } from "./demo-banner";
import { demoAdminCollections, demoAdminProducts } from "@/lib/demo-admin/catalog";
import { demoStore } from "@/lib/demo-admin/store";
import { useDemoEdits } from "@/lib/demo-admin/use-demo-catalog";

/* Products: the real admin's list, over the sample pendants and this browser's edits. Hide or publish works at once, and the store follows. */
export function DemoProducts() {
  const edits = useDemoEdits();
  const products = demoAdminProducts(edits);
  const hidden = products.filter((product) => !product.published).length;
  const low = products.filter((product) => product.published && product.stock <= 5).length;
  return (
    <>
      <div className="pt-10">
        <p className="eyebrow">Catalog</p>
        <h1 className="mt-2 font-display text-[clamp(2.2rem,4vw,3rem)] font-light leading-none tracking-[-0.02em]">Products</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {products.length - hidden} visible in the store · {hidden} hidden{low > 0 && ` · ${low} low on stock or sold out`}
        </p>
      </div>
      <DemoBanner />
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
