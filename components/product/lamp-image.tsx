import { cn } from "cn";
import type { ProductImages } from "@/lib/catalog/types";

type LampImageProps = {
  product: { images: ProductImages };
  /** Which photo shows: lit, unlit, lit only while a parent `.group` is hovered or keyboard-focused, or a dimmer level from 0 to 1. */
  lit: boolean | "hover" | number;
  /** Positions the photo box. The box keeps the pair's own proportions unless `fit` is "cover". */
  className?: string;
  /** "hang" anchors the lamp at the top of its box, cord first; "cover" crops onto the shade for thumbnails. */
  fit?: "hang" | "cover";
  /** Load immediately instead of lazily (above the fold). */
  eager?: boolean;
};

/*
 * Every off/on pair outside the rail is drawn here, with identical boxes and object-fit for both photos, so the lit photo lands on
 * exactly the same pixels as the unlit one and only the light changes. Plain <img> on purpose: the pairs must never be resized or
 * re-encoded differently (see docs/ASSETS.md).
 */
export function LampImage({ product, lit, className, fit = "hang", eager = false }: LampImageProps) {
  const { off, on, alt, width, height } = product.images;
  const photo = cn(
    "absolute inset-0 size-full max-w-none select-none",
    fit === "hang" ? "object-contain object-top" : "object-cover object-[50%_58%]",
  );
  const loading = eager ? "eager" : "lazy";
  return (
    <span className={cn("pointer-events-none absolute block", className)} style={fit === "hang" ? { aspectRatio: `${width} / ${height}` } : undefined}>
      <img src={off} alt={alt} width={width} height={height} loading={loading} decoding="async" draggable={false} className={photo} />
      <img
        src={on}
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        draggable={false}
        className={cn(
          photo,
          "transition-opacity ease-out motion-reduce:transition-none",
          typeof lit === "number" ? "duration-300" : "duration-500",
          lit === "hover" ? "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" : typeof lit === "number" ? undefined : lit ? "opacity-100" : "opacity-0",
        )}
        style={typeof lit === "number" ? { opacity: Math.max(0, Math.min(1, lit)) } : undefined}
      />
    </span>
  );
}
