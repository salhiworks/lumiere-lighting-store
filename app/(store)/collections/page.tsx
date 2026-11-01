import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import { getCollectionsWithProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Collections",
  description: "Pendants grouped by the light they give: focused metal and concrete, room-filling glass, soft paper and rattan.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const collections = await getCollectionsWithProducts();
  return (
    <div className="shell pb-24 pt-12 sm:pt-16">
      <header className="max-w-2xl">
        <p className="eyebrow">Collections</p>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,4.6vw,3.6rem)] font-light leading-[1.02] tracking-[-0.025em]">Grouped by the light they give</h1>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
          Pick the effect first, then the shade: a focused pool over the table, an ambient glow for the whole room, or a softer light with some
          texture.
        </p>
      </header>

      <div className="mt-16 space-y-20 sm:space-y-24">
        {collections.map(({ collection, products }) => {
          return (
            <section key={collection.id} aria-labelledby={`${collection.id}-title`}>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 id={`${collection.id}-title`} className="font-display text-[clamp(1.8rem,3vw,2.4rem)] font-light leading-tight tracking-[-0.02em]">
                    {collection.name}
                  </h2>
                  <p className="mt-1.5 max-w-[48ch] text-sm leading-relaxed text-muted-foreground">{collection.description}</p>
                </div>
                <Link
                  href={`/shop?collection=${collection.id}`}
                  className="group/link inline-flex items-center gap-1.5 rounded-sm text-sm font-medium underline decoration-foreground/25 underline-offset-[6px] outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Shop {collection.name}
                  <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                </Link>
              </div>
              <ProductGrid products={products} className="mt-8" />
            </section>
          );
        })}
      </div>
    </div>
  );
}
