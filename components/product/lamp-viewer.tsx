"use client";

import * as React from "react";
import { productTitle } from "@/lib/catalog/helpers";
import type { Product } from "@/lib/catalog/types";
import { LightControls, LightStage, useLight, type Room } from "./light-stage";

const CAPTIONS: Record<Room, [string, string]> = {
  day: ["Switched off, as it looks by day.", "Lit with the included LED lamp, in daylight."],
  evening: ["Switched off, after dark.", "Lit with the included LED lamp, after dark."],
};

/* The product page's centrepiece: the lamp on its lighting stage, with a switch, a dimmer and a day or evening room. */
export function LampViewer({ product }: { product: Product }) {
  const { level, on, setLevel, toggle } = useLight(1);
  const [room, setRoom] = React.useState<Room>("day");
  return (
    <figure className="mx-auto w-full lg:sticky lg:top-24 lg:max-w-[min(100%,calc((100svh-13rem)*0.8))]">
      <div className="overflow-hidden rounded-2xl shadow-[0_1px_0_rgb(255_255_255/0.6)_inset,0_30px_60px_-40px_rgb(35_32_28/0.45)]">
        <LightStage images={product.images} level={level} room={room} eager />
      </div>
      <figcaption className="mt-5 grid gap-3">
        <LightControls level={level} onLevel={setLevel} onToggle={toggle} room={room} onRoom={setRoom} label={productTitle(product)} />
        <span className="text-[13px] text-muted-foreground" aria-live="polite">
          {CAPTIONS[room][on ? 1 : 0]}
        </span>
      </figcaption>
    </figure>
  );
}
