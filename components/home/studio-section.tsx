import { catalogFacts } from "@/lib/catalog/helpers";
import type { Product } from "@/lib/catalog/types";

/* The studio story, kept short, with the practical facts set like a lighting spec sheet. The facts are computed from the catalog. */
export function StudioSection({ products, collectionCount }: { products: Product[]; collectionCount: number }) {
  const facts = catalogFacts(products);
  const rows = [
    { label: "Designs", value: `${facts.count} pendants in ${collectionCount} collections` },
    { label: "Shades", value: `Ø ${facts.minDiameter} to ${facts.maxDiameter} cm` },
    { label: "Light", value: "E27 or GU10 LED, 4 to 6 W, included" },
    { label: "Cord", value: "1.5 m black fabric" },
    ...(facts.fromPrice ? [{ label: "Prices", value: `From ${facts.fromPrice}` }] : []),
  ];
  return (
    <section id="studio" aria-labelledby="studio-title" className="scroll-mt-16 border-t border-border bg-secondary/45">
      <div className="shell grid gap-12 py-20 sm:py-28 lg:grid-cols-[1fr_1fr] lg:gap-24">
        <div>
          <p className="eyebrow">The studio</p>
          <h2 id="studio-title" className="mt-3 max-w-[14ch] font-display text-[clamp(2.1rem,3.8vw,3.1rem)] font-light leading-[1.04] tracking-[-0.02em]">
            One material, one kind of light.
          </h2>
          <p className="mt-8 max-w-[52ch] text-[17px] leading-[1.7] text-foreground/85">
            LUMIÈRE is a small lighting studio. Each pendant starts from a single material and is shaped around the light it gives. Enamel,
            brass, copper and concrete focus it onto the table. Glass spreads it through the room. Rattan and washi paper soften it and give
            it grain.
          </p>
        </div>
        <div className="lg:pt-9">
          <h3 className="eyebrow">At a glance</h3>
          <dl className="mt-4 border-t border-foreground/15">
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[7rem_1fr] items-baseline gap-4 border-b border-border py-3.5 sm:grid-cols-[9rem_1fr]">
                <dt className="eyebrow">{row.label}</dt>
                <dd className="font-mono text-[13px] text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
