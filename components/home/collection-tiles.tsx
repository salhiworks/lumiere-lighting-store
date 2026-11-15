import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LampImage } from "@/components/product/lamp-image";
import type { Collection, Product } from "@/lib/catalog/types";

/*
 * The showroom bays, one per collection. Each bay has its own length of track; its pendants hang from it and switch on together on
 * hover or keyboard focus, and the bay's wall warms with them, so the difference between a focused pool and a room-filling glow shows.
 */
export function CollectionTiles({ entries }: { entries: { collection: Collection; products: Product[] }[] }) {
  return (
    <section aria-labelledby="collections-title" className="shell py-20 sm:py-28">
      <div className="settle flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">The showroom</p>
          <h2 id="collections-title" className="mt-3 font-display text-[clamp(2rem,3.6vw,3rem)] font-light leading-[1.05] tracking-[-0.025em]">
            {entries.length === 3 ? "Three ways to light a room" : "Shop by the light they give"}
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

      <ul className="mt-12 grid gap-5 md:grid-cols-3">
        {entries.map(({ collection, products: lamps }, index) => (
          <li key={collection.id} className="settle">
            <Link
              href={`/shop?collection=${collection.id}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/60 outline-none transition-[border-color,box-shadow] duration-500 hover:border-foreground/20 hover:shadow-[0_30px_60px_-45px_rgb(35_32_28/0.5)] focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
            >
              <span aria-hidden="true" className="relative block aspect-[11/5] overflow-hidden bg-secondary/60">
                <span className="room-glow absolute inset-x-[-10%] top-[-10%] h-[110%] opacity-0 transition-opacity duration-700 group-hover:opacity-80 group-focus-visible:opacity-80 motion-reduce:transition-none" />
                {/* The bay's own length of brushed track. */}
                <span className="absolute inset-x-[8%] top-0 h-[5px] rounded-b-[3px] bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--muted-foreground)_40%,white),var(--muted-foreground))] shadow-[0_1px_2px_rgb(35_32_28/0.2)]" />
                <span className="absolute inset-x-[8%] top-0 flex h-full justify-center gap-[2.5%]">
                  {lamps.slice(0, 4).map((product, lamp) => (
                    <span key={product.id} className="relative block h-full w-[23%]">
                      <span
                        className="light-pool absolute left-1/2 top-[52%] h-[48%] w-[150%] -translate-x-1/2 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
                        style={{ transitionDelay: `${lamp * 90}ms` }}
                      />
                      <LampImage product={product} lit="hover" className="inset-x-0 top-0 w-full" />
                    </span>
                  ))}
                </span>
              </span>
              <span className="flex flex-1 flex-col px-6 pb-6 pt-5">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-[1.65rem] leading-tight tracking-[-0.01em]">{collection.name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">Bay {String(index + 1).padStart(2, "0")}</span>
                </span>
                <span className="mt-2 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">{collection.description}</span>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium">
                  Shop {lamps.length} {lamps.length === 1 ? "pendant" : "pendants"}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
