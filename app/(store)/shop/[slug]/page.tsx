import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AddToCart } from "@/components/product/add-to-cart";
import { LampViewer } from "@/components/product/lamp-viewer";
import { ProductGrid } from "@/components/product/product-grid";
import { StockBadge } from "@/components/product/stock-badge";
import { getCollections, getProductBySlug, getProducts } from "@/lib/catalog";
import { productTitle } from "@/lib/catalog/helpers";
import { formatPrice } from "@/lib/format";

/*
 * Every published product is prerendered. proxy.ts answers unknown and hidden slugs with the store's 404 page before this page
 * runs. The page still looks the product up before anything streams (in case the proxy couldn't reach the database); waiting for
 * that lookup is allowed here (instant = false), and product cards prefetch the full page, so clicking one shows it straight away.
 */
export const instant = false;

export async function generateStaticParams() {
  const products = await getProducts();
  // Cache Components needs at least one entry; an empty catalog prerenders a placeholder, which proxy.ts answers with a 404.
  return products.length ? products.map((product) => ({ slug: product.slug })) : [{ slug: "no-products-yet" }];
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Pendant not found" };
  const title = productTitle(product);
  return {
    title,
    description: `${product.summary} ${formatPrice(product.priceCents, product.currency)}.`,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      title,
      description: product.summary,
      images: [{ url: product.images.on, width: product.images.width, height: product.images.height, alt: product.images.alt }],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  const collection = collections.find((item) => item.id === product.collection) ?? { id: product.collection, name: "Collection", description: "" };
  const others = products.filter((item) => item.id !== product.id);
  const related = [...others.filter((item) => item.collection === product.collection), ...others.filter((item) => item.collection !== product.collection)].slice(0, 4);

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
