import type { Collection, Product } from "@/lib/catalog/types";
import { toPendantLamp } from "@/lib/catalog/helpers";
import { countWord } from "@/lib/format";
import { AfterDark } from "./after-dark";
import { CollectionTiles } from "./collection-tiles";
import { LampRailHero, SwipeCue } from "./lamp-rail-hero";
import { StudioSection } from "./studio-section";

/*
 * The homepage's content, given the catalog it should show. The page passes the server's catalog; the public demo re-renders it with
 * the visitor's edits. Its pacing: the rail by day, the same lamps after dark, the showroom bays, then the studio's spec sheet.
 */
export function HomeBody({ products, collections }: { products: Product[]; collections: { collection: Collection; products: Product[] }[] }) {
  const lamps = products.map(toPendantLamp);
  return (
    <>
      <section aria-labelledby="hero-title" className="relative">
        <LampRailHero
          items={lamps}
          intro={
            <div className="shell relative pt-8 text-center sm:pt-16">
              <p className="eyebrow">
                Pendant lighting studio
                <span className="hidden sm:inline">
                  {" "}
                  <span aria-hidden="true">·</span> {countWord(products.length)} designs
                </span>
              </p>
              <h1
                id="hero-title"
                className="mx-auto mt-4 max-w-[14ch] text-balance font-display text-[clamp(2.5rem,6vw,5.4rem)] sm:mt-5 font-light leading-[0.98] tracking-[-0.035em] md:max-w-none"
              >
                Switch on <em className="font-light italic text-brass-deep">the collection.</em>
              </h1>
              <SwipeCue />
              <p className="mx-auto mt-5 hidden max-w-[50ch] text-balance text-[15px] leading-relaxed text-muted-foreground sm:block sm:text-base">
                {countWord(products.length)} pendants on one brass track, each photographed off and lit. Light them, swing them, lift one down to dim it.
              </p>
            </div>
          }
        />
      </section>
      {/* Day turns to evening: the porcelain page fades into the night room of the next scene. */}
      <div aria-hidden="true" className="dusk h-36 sm:h-52" />
      <AfterDark products={products} collections={collections.map((entry) => entry.collection)} />
      <CollectionTiles entries={collections} />
      <StudioSection products={products} collectionCount={collections.length} />
    </>
  );
}
