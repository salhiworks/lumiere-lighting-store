"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "cn";
import { LampImage } from "@/components/product/lamp-image";
import { LightControls, LightStage, useLight } from "@/components/product/light-stage";
import { ProductLink } from "@/components/product/product-link";
import { productTitle } from "@/lib/catalog/helpers";
import type { Collection, Product } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";

const DUSK_LEVEL = 0.8;

/*
 * The homepage's second act: the same pendants after dark. One lamp hangs over a table in a dark room; the visitor picks a pendant and
 * turns the dimmer, and the photo, the pool on the table and the warmth of the room follow together. As the scene first scrolls into
 * view the lamp comes up slowly, like a light switched on at dusk; with reduced motion it is simply on.
 */
export function AfterDark({ products, collections }: { products: Product[]; collections: Collection[] }) {
  const [selectedId, setSelectedId] = React.useState(() => pickOpening(products)?.id ?? null);
  const { level, setLevel, toggle } = useLight(0);
  const sectionRef = React.useRef<HTMLElement>(null);
  const touched = React.useRef(false);
  const product = products.find((item) => item.id === selectedId) ?? products[0];

  React.useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        if (touched.current) return;
        if (reduced) return setLevel(DUSK_LEVEL);
        const start = performance.now();
        const step = (now: number) => {
          if (touched.current) return;
          const t = Math.min(1, (now - start) / 1600);
          setLevel(DUSK_LEVEL * (1 - Math.pow(1 - t, 3)));
          if (t < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.45 },
    );
    observer.observe(section);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [setLevel]);

  if (!product) return null;
  const collection = collections.find((item) => item.id === product.collection);
  const take = <T,>(fn: (value: T) => void) => (value: T) => {
    touched.current = true;
    fn(value);
  };

  return (
    <section ref={sectionRef} aria-labelledby="after-dark-title" className="relative isolate overflow-hidden bg-night text-night-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[60%] bg-[radial-gradient(50%_60%_at_68%_0%,color-mix(in_oklab,var(--brass)_9%,transparent),transparent)]" />
      <div className="shell grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <div className="settle order-2 lg:order-1">
          <p className="eyebrow text-night-muted!">After dark</p>
          <h2 id="after-dark-title" className="mt-4 max-w-[12ch] font-display text-[clamp(2.4rem,4.6vw,3.8rem)] font-light leading-[1] tracking-[-0.03em]">
            Set the <em className="text-ember">evening.</em>
          </h2>
          <p className="mt-6 max-w-[46ch] text-[16px] leading-[1.7] text-night-muted">
            Every pendant is photographed twice: switched off, and lit by its own lamp. Choose one, turn the dimmer, and see the light it gives a table at
            night.
          </p>

          <fieldset className="mt-10">
            <legend className="eyebrow text-night-muted!">Choose a pendant</legend>
            <div className="mt-4 flex flex-wrap gap-2">
              {products.map((item) => {
                const active = item.id === product.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    aria-label={productTitle(item)}
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "group relative h-16 w-12 overflow-hidden rounded-md border outline-none transition-[border-color,background-color,transform] duration-300 focus-visible:ring-2 focus-visible:ring-ember motion-reduce:transition-none",
                      active ? "border-ember/70 bg-night-raised" : "border-night-line hover:-translate-y-0.5 hover:border-night-muted/60",
                    )}
                  >
                    <LampImage product={item} lit={active ? true : "hover"} fit="cover" className="inset-0" />
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-10 border-t border-night-line pt-6" aria-live="polite">
            <p className="font-display text-[1.75rem] leading-tight tracking-[-0.01em]">
              {product.name} <span className="italic text-night-muted">{product.finish}</span>
            </p>
            {collection && <p className="mt-2 max-w-[44ch] text-[14px] leading-relaxed text-night-muted">{collection.description}</p>}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="font-mono text-[13px] text-night-foreground">{formatPrice(product.priceCents, product.currency)}</span>
            <ProductLink
              product={product}
              className="group/link inline-flex items-center gap-1.5 rounded-sm text-sm font-medium underline decoration-night-muted/40 underline-offset-[6px] outline-none hover:decoration-night-foreground focus-visible:ring-2 focus-visible:ring-ember"
            >
              View this pendant
              <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
            </ProductLink>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="mx-auto max-w-[34rem] overflow-hidden rounded-2xl shadow-[0_40px_80px_-40px_rgb(0_0_0/0.8)] ring-1 ring-night-line">
            <LightStage key={product.id} images={product.images} level={level} room="evening" />
          </div>
          <LightControls
            level={level}
            onLevel={take(setLevel)}
            onToggle={() => {
              touched.current = true;
              toggle();
            }}
            label={productTitle(product)}
            surface="night"
            className="mx-auto mt-6 max-w-[34rem]"
          />
        </div>
      </div>
    </section>
  );
}

/* Opens on a pendant whose light carries in a dark room: a paper or glass shade if the catalog has one, otherwise the first. */
function pickOpening(products: Product[]) {
  return products.find((product) => product.collection === "paper-rattan") ?? products.find((product) => product.collection === "glass") ?? products[0];
}
