import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AddToCart } from "@/components/product/add-to-cart";
import { LampViewer } from "@/components/product/lamp-viewer";
import { ProductGrid } from "@/components/product/product-grid";
import { StockBadge } from "@/components/product/stock-badge";
import { productTitle } from "@/lib/catalog/helpers";
import type { Collection, Product } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";

/** The "more pendants" picks: the product's own collection first, then the rest. */
export function relatedProducts(product: Product, products: Product[]) {
  const others = products.filter((item) => item.id !== product.id);
  return [...others.filter((item) => item.collection === product.collection), ...others.filter((item) => item.collection !== product.collection)].slice(0, 4);
}

/* The product page's content, shared by the page and the public demo's edited view. */
export function ProductDetail({ product, collection, related }: { product: Product; collection: Collection; related: Product[] }) {
  return (
    <>
      <div className="shell pt-6 sm:pt-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            <li>
              <Link href="/shop" className="rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                Shop
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/shop?collection=${collection.id}`} className="rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                {collection.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              {productTitle(product)}
            </li>
          </ol>
        </nav>
      </div>

      <article className="shell grid gap-10 pb-20 pt-6 sm:pt-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 xl:gap-24">
        <LampViewer product={product} />

        <div className="lg:pt-4">
          <p className="eyebrow">{collection.name}</p>
          <h1 className="mt-3 font-display text-[clamp(2.6rem,4.8vw,4rem)] font-light leading-[0.98] tracking-[-0.03em]">{product.name}</h1>
          <p className="mt-2 font-display text-xl text-muted-foreground">{product.finish}</p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
            <p className="text-2xl tabular-nums">{formatPrice(product.priceCents, product.currency)}</p>
            <StockBadge product={product} />
          </div>

          <p className="mt-6 max-w-[54ch] text-[16px] leading-[1.7] text-foreground/85">{product.description}</p>

          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          <ul aria-label="Highlights" className="mt-6 flex flex-wrap gap-2">
            {product.highlights.map((highlight) => (
              <li key={highlight} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {highlight}
              </li>
            ))}
          </ul>

          <section aria-labelledby="specs-title" className="mt-10">
            <h2 id="specs-title" className="eyebrow">
              Specifications
            </h2>
            <dl className="mt-3 border-t border-foreground/15">
              {product.specs.map((spec) => (
                <div key={spec.label} className="grid grid-cols-[7.5rem_1fr] items-baseline gap-4 border-b border-border py-3">
                  <dt className="text-[13px] text-muted-foreground">{spec.label}</dt>
                  <dd className="font-mono text-[13px]">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <Link
            href="/shop"
            className="group/link mt-10 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium underline decoration-foreground/25 underline-offset-[6px] outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover/link:-translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
            Back to all pendants
          </Link>
        </div>
      </article>

      <section aria-labelledby="related-title" className="border-t border-border bg-secondary/40 py-20">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="related-title" className="font-display text-[clamp(1.8rem,3vw,2.4rem)] font-light tracking-[-0.02em]">
              More pendants
            </h2>
            <Link href="/shop" className="rounded-sm text-sm font-medium underline decoration-foreground/25 underline-offset-[6px] outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring">
              View all pendants
            </Link>
          </div>
          <ProductGrid products={related} className="mt-10" />
        </div>
      </section>
    </>
  );
}
