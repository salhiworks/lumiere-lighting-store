"use client";

import * as React from "react";
import { cn } from "cn";
import type { Product } from "@/lib/catalog/types";
import { HangingLamp } from "./hanging-lamp";
import { LampImage } from "./lamp-image";

/* The product photo with a light switch: the paired lit and unlit photos cross-fade, and the pool of light follows. */
export function LampViewer({ product }: { product: Product }) {
  const [lit, setLit] = React.useState(true);
  return (
    <figure className="lg:sticky lg:top-24">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[radial-gradient(70%_55%_at_50%_58%,color-mix(in_oklab,var(--card)_80%,transparent),transparent)] bg-secondary/70">
        <span aria-hidden="true" className="ceiling-canopy absolute left-1/2 top-0 z-10 w-10 -translate-x-1/2" />
        <span
          aria-hidden="true"
          className={cn(
            "light-pool absolute left-1/2 top-[46%] h-[54%] w-full -translate-x-1/2 transition-opacity duration-700 motion-reduce:transition-none",
            lit ? "opacity-100" : "opacity-0",
          )}
        />
        <HangingLamp>
          <LampImage product={product} lit={lit} eager className="left-[15%] top-0 w-[70%]" />
        </HangingLamp>
      </div>
      <figcaption className="mt-4 flex items-center justify-between gap-4">
        <span className="text-[13px] text-muted-foreground">{lit ? "Lit with the included LED lamp." : "Switched off, as it looks by day."}</span>
        <button
          type="button"
          role="switch"
          aria-checked={lit}
          onClick={() => setLit((value) => !value)}
          className="group/switch inline-flex h-10 shrink-0 items-center gap-3 rounded-full pl-1 pr-1 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Light
          <span
            aria-hidden="true"
            className={cn(
              "relative h-6 w-11 rounded-full border transition-colors duration-300 motion-reduce:transition-none",
              lit ? "border-brass bg-brass" : "border-foreground/20 bg-secondary",
            )}
          >
            <span
              className={cn(
                "absolute top-1/2 size-[18px] -translate-y-1/2 rounded-full bg-card shadow-[0_1px_3px_rgb(35_32_28/0.3)] transition-[left] duration-300 motion-reduce:transition-none",
                lit ? "left-[calc(100%-21px)]" : "left-[2px]",
              )}
            />
          </span>
        </button>
      </figcaption>
    </figure>
  );
}
