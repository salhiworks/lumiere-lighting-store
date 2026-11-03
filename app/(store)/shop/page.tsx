import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ShopIntro } from "@/components/demo-admin/demo-shop-intro";
import { ProductGridSkeleton } from "@/components/shop/product-grid-skeleton";
import { ShopBrowser } from "@/components/shop/shop-browser";
import { getCollectionsWithProducts, getProducts } from "@/lib/catalog";
import { catalogFacts } from "@/lib/catalog/helpers";
import { countWord } from "@/lib/format";
import { PUBLIC_DEMO } from "@/lib/public-demo";

export async function generateMetadata(): Promise<Metadata> {
  const { fromPrice } = catalogFacts(await getProducts());
  return {
    title: "Shop all pendants",
    description: `Every LUMIÈRE pendant in one place: enamel, brass, copper, concrete, glass, rattan and washi paper${fromPrice ? `, from ${fromPrice}` : ""}.`,
    alternates: { canonical: "/shop" },
  };
}

export default async function ShopPage() {
  const [products, collections] = await Promise.all([getProducts(), getCollectionsWithProducts()]);
  return (
    <div className="shell pb-24 pt-12 sm:pt-16">
      <header className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Shop</p>
          <h1 className="mt-3 font-display text-[clamp(2.4rem,4.6vw,3.6rem)] font-light leading-none tracking-[-0.025em]">All pendants</h1>
        </div>
        {PUBLIC_DEMO ? (
          <ShopIntro products={products} collectionIds={collections.map((entry) => entry.collection.id)} />
        ) : (
          <p className="max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
            {countWord(products.length)} designs in {collections.length} collections. Each pendant ships with its LED lamp and a 1.5 m fabric
            cord.
          </p>
        )}
      </header>
      {/* The header above and this skeleton are prerendered; the grid depends on the URL, so it streams in per request. */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <ShopResults />
      </Suspense>
    </div>
  );
}

/*
 * connection() makes this part render for each request, so the browser below is server-rendered with the request's ?collection
 * and ?sort and the filtered grid is in the HTML. Without it, the static page would ship only the skeleton and draw the grid after
 * hydration. Later filter changes happen in the browser, instantly.
 */
async function ShopResults() {
  await connection();
  const [products, collections] = await Promise.all([getProducts(), getCollectionsWithProducts()]);
  return <ShopBrowser products={products} collections={collections.map((entry) => entry.collection)} />;
}
