"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "cn";
import { LampImage } from "@/components/product/lamp-image";
import { LightControls, LightStage, useLight, type Room } from "@/components/product/light-stage";
import { getStockStatus } from "@/lib/catalog/helpers";
import type { ProductImages } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";

export type PreviewDraft = {
  name: string;
  finish: string;
  /** Null while the price field doesn't hold a valid price yet. */
  priceCents: number | null;
  stock: number | null;
  published: boolean;
  drop: number;
  collectionName?: string;
};

/*
 * The editor's live preview: the product on the storefront's own lighting stage (switch, dimmer, day or evening room), then as the
 * shop grid and the homepage rail will show it. It reads the form as it is typed, and the photos as picked, before anything is saved,
 * using the same components the storefront renders, so what the owner sees here is what visitors will see.
 */
export function ProductPreview({ images, draft, unsavedPhotos }: { images: ProductImages | null; draft: PreviewDraft; unsavedPhotos: boolean }) {
  const { level, setLevel, toggle } = useLight(1);
  const [room, setRoom] = React.useState<Room>("evening");
  const title = [draft.name.trim() || "Untitled pendant", draft.finish.trim()].filter(Boolean).join(" · ");
  const price = draft.priceCents ? formatPrice(draft.priceCents) : "—";
  const stock = draft.stock === null ? null : getStockStatus({ stock: draft.stock });

  return (
    <section aria-labelledby="preview-title" className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_50px_-40px_rgb(35_32_28/0.5)]">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h2 id="preview-title" className="font-display text-[1.3rem] leading-none tracking-[-0.01em]">
          Live preview
        </h2>
        <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium", draft.published ? "text-[oklch(0.45_0.09_150)]" : "text-muted-foreground")}>
          {draft.published ? <Eye className="size-3.5" aria-hidden="true" /> : <EyeOff className="size-3.5" aria-hidden="true" />}
          {draft.published ? "Visible in the store" : "Hidden from the store"}
        </span>
      </header>

      {images ? (
        <>
          <div className="relative">
            <LightStage images={images} level={level} room={room} />
            {unsavedPhotos && (
              <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium backdrop-blur">New photos · not saved yet</span>
            )}
          </div>
          <div className="border-b border-border px-5 py-4">
            <LightControls level={level} onLevel={setLevel} onToggle={toggle} room={room} onRoom={setRoom} label={title} />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-0 divide-x divide-border">
            {/* As a shop card: hover lights it, exactly as in the grid. */}
            <div className="group px-5 pb-5 pt-4" tabIndex={0} aria-label={`Shop card preview: ${title}, ${price}`}>
              <p className="eyebrow">In the shop</p>
              <span aria-hidden="true" className="relative mt-3 block aspect-[4/5] overflow-hidden border-t border-foreground/15">
                <span className="ceiling-canopy absolute left-1/2 top-0 z-10 -translate-x-1/2 scale-75" />
                <span className="light-pool absolute left-1/2 top-[58%] h-[42%] w-full -translate-x-1/2 opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
                <LampImage product={{ images }} lit="hover" className="left-[6%] top-0 w-[88%]" />
              </span>
              <span aria-hidden="true" className="mt-2 flex items-baseline justify-between gap-2">
                <span className="truncate font-display text-[15px] leading-tight">{draft.name.trim() || "Untitled"}</span>
                <span className="text-[12px] tabular-nums">{price}</span>
              </span>
              <span aria-hidden="true" className="block truncate text-[11.5px] text-muted-foreground">
                {draft.finish.trim() || "Finish"}
                {stock && stock.tone !== "in" && <span className={cn(stock.tone === "low" && "text-brass-deep")}> · {stock.label}</span>}
              </span>
            </div>

            {/* On the homepage rail: how low it hangs (the cord length) and its price tag. */}
            <div className="px-5 pb-5 pt-4">
              <p className="eyebrow">On the rail</p>
              <div aria-hidden="true" className="relative mt-3 aspect-[4/5]">
                <span className="absolute inset-x-0 top-0 h-[5px] rounded-full bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--muted-foreground)_40%,white),var(--muted-foreground))]" />
                <span className="absolute left-1/2 top-[5px] w-px -translate-x-1/2 bg-foreground/70" style={{ height: `${railOffset(draft.drop)}%` }} />
                <span className="absolute left-[22%] w-[56%]" style={{ top: `calc(5px + ${railOffset(draft.drop)}%)` }}>
                  <span className="relative block" style={{ aspectRatio: `${images.width} / ${images.height}` }}>
                    <LampImage product={{ images }} lit={level} className="inset-0 w-full" />
                  </span>
                </span>
              </div>
              <p className="mt-2 truncate text-[12px] font-medium">
                {title} <span className="ml-1 rounded-full border border-border px-1.5 py-px text-[10.5px] tabular-nums text-muted-foreground">{price}</span>
              </p>
              <p className="text-[11.5px] text-muted-foreground">Cord {draft.drop.toFixed(2)}</p>
            </div>
          </div>
        </>
      ) : (
        <p className="px-6 py-16 text-center text-sm text-muted-foreground">Choose a photo pair to light the preview.</p>
      )}
    </section>
  );
}

/* Extra cord above the photo for a given rail drop (0.5–1.1), as a share of the preview's height: longer cords hang lower. */
function railOffset(drop: number) {
  return Math.max(0, Math.min(1.2, drop) - 0.45) * 38;
}

/** Reads the preview fields from a product form as it is typed. Field names match the real and demo product forms. */
export function readDraft(form: HTMLFormElement, collections: { id: string; name: string }[]): PreviewDraft {
  const data = new FormData(form);
  const text = (name: string) => {
    const value = data.get(name);
    return typeof value === "string" ? value : "";
  };
  const priceText = text("price").trim();
  const price = /^\d{1,6}(\.\d{1,2})?$/.test(priceText) ? Math.round(Number(priceText) * 100) : null;
  const stockText = text("stock").trim();
  const collection = text("collection");
  return {
    name: text("name"),
    finish: text("finish"),
    priceCents: price && price > 0 ? price : null,
    stock: /^\d+$/.test(stockText) ? Number(stockText) : null,
    published: data.get("published") === "on",
    drop: Number(text("drop")) || 0.75,
    collectionName: collections.find((item) => item.id === collection)?.name,
  };
}
