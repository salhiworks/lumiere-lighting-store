import type { Collection, Product } from "@/lib/catalog/types";
import { toPendantLamp } from "@/lib/catalog/helpers";
import { countWord } from "@/lib/format";
import { CollectionTiles } from "./collection-tiles";
import { LampRailHero } from "./lamp-rail-hero";
import { StudioSection } from "./studio-section";

/* The homepage's content, given the catalog it should show. The page passes the server's catalog; the public demo re-renders it with the visitor's edits. */
export function HomeBody({ products, collections }: { products: Product[]; collections: { collection: Collection; products: Product[] }[] }) {
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
