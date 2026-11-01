import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LampImage } from "@/components/product/lamp-image";
import type { Collection, Product } from "@/lib/catalog/types";

/* Three showroom bays, one per collection. Each bay's pendants hang from the shared ceiling rule and switch on together on hover. */
export function CollectionTiles({ entries }: { entries: { collection: Collection; products: Product[] }[] }) {
  return (
    <section aria-labelledby="collections-title" className="shell py-20 sm:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Shop by light</p>
          <h2 id="collections-title" className="mt-3 font-display text-[clamp(2rem,3.4vw,2.85rem)] font-light leading-[1.05] tracking-[-0.02em]">
            Three ways to light a room
          </h2>
        </div>
        <Link
          href="/collections"
          className="group/link inline-flex items-center gap-1.5 rounded-sm text-sm font-medium underline decoration-foreground/25 underline-offset-[6px] outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          All collections
          <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
        </Link>
      </div>

      <ul className="mt-12 grid border-t border-foreground/15 md:grid-cols-3">
        {entries.map(({ collection, products: lamps }) => {
          return (
            <li key={collection.id} className="border-b border-border md:border-b-0 md:border-l md:first:border-l-0">
              <Link
                href={`/shop?collection=${collection.id}`}
                className="group flex h-full flex-col px-1 pb-8 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:px-8"
              >
                {/* Every bay hangs its lamps at the same scale: 23% of the bay each, in a box as tall as the lamps (photos end at ~78%). */}
                <span aria-hidden="true" className="relative flex aspect-[8/3] justify-center gap-[2.5%] overflow-hidden">
                  {lamps.map((product) => (
                    <span key={product.id} className="relative block w-[23%]">
                      <span className="ceiling-canopy absolute left-1/2 top-0 z-10 w-5 -translate-x-1/2" />
                      <span className="light-pool absolute left-1/2 top-[50%] h-[50%] w-[140%] -translate-x-1/2 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
                      <LampImage product={product} lit="hover" className="inset-x-0 top-0 w-full" />
                    </span>
                  ))}
                </span>
                <span className="mt-6 font-display text-[1.65rem] leading-tight tracking-[-0.01em]">{collection.name}</span>
                <span className="mt-2 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">{collection.description}</span>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium">
                  Shop {lamps.length} {lamps.length === 1 ? "pendant" : "pendants"}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
