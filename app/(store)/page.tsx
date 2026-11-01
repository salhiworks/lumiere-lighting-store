import { CollectionTiles } from "@/components/home/collection-tiles";
import { LampRailHero } from "@/components/home/lamp-rail-hero";
import { StudioSection } from "@/components/home/studio-section";
import { getCollectionsWithProducts, getProducts } from "@/lib/catalog";
import { toPendantLamp } from "@/lib/catalog/helpers";
import { countWord } from "@/lib/format";

export default async function HomePage() {
  const [products, collections] = await Promise.all([getProducts(), getCollectionsWithProducts()]);
  const lamps = products.map(toPendantLamp);
  return (
    <>
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        <div className="shell pt-10 text-center sm:pt-14">
          <p className="eyebrow">Pendant lighting · {countWord(products.length)} designs</p>
          <h1
            id="hero-title"
            className="mx-auto mt-4 max-w-[16ch] text-balance font-display text-[clamp(2.6rem,5.2vw,4.5rem)] font-light leading-[1.02] tracking-[-0.03em] md:max-w-none"
          >
            Switch on the collection.
          </h1>
        </div>
        <LampRailHero items={lamps} />
      </section>
      <CollectionTiles entries={collections} />
      <StudioSection products={products} collectionCount={collections.length} />
    </>
  );
}
