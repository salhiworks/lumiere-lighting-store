import type { ProductImages } from "@/lib/catalog/types";

/*
 * Turns a photo pair picked in the Demo Admin Dashboard into two small data URLs for localStorage. There is no upload: the files
 * never leave the browser. Both photos are scaled by the same factor and re-encoded the same way, so the pair keeps its shared
 * framing (docs/ASSETS.md), and each is capped so a few edited products fit in the browser's storage.
 */

const MAX_HEIGHT = 900;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_PAIR_CHARS = 1_400_000;

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error(`${file.name || "A photo"} couldn’t be read. Use a PNG or WebP cut-out.`);
  }
}

function encode(bitmap: ImageBitmap, width: number, height: number, type: "image/webp" | "image/png", quality: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser can’t prepare the photos.");
  context.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL(type, quality);
}

export async function preparePhotoPair(off: File, on: File, alt: string): Promise<ProductImages> {
  for (const file of [off, on]) {
    if (file.type !== "image/png" && file.type !== "image/webp") throw new Error("Photos must be PNG or WebP files with a transparent background.");
    if (file.size > MAX_FILE_BYTES) throw new Error("Each photo must be under 8 MB.");
  }
  const [offBitmap, onBitmap] = await Promise.all([decode(off), decode(on)]);
  try {
    if (offBitmap.width !== onBitmap.width || offBitmap.height !== onBitmap.height) {
      throw new Error("The two photos must have exactly the same pixel size, so the lit photo lands on the unlit one.");
    }
    const scale = Math.min(1, MAX_HEIGHT / offBitmap.height);
    const width = Math.max(1, Math.round(offBitmap.width * scale));
    const height = Math.max(1, Math.round(offBitmap.height * scale));
    for (const quality of [0.86, 0.7, 0.55]) {
      const offUrl = encode(offBitmap, width, height, "image/webp", quality);
      const onUrl = encode(onBitmap, width, height, "image/webp", quality);
      if (!offUrl.startsWith("data:image/webp") || !onUrl.startsWith("data:image/webp")) throw new Error("This browser can’t save WebP photos. Try Chrome, Edge, Firefox or a recent Safari.");
      if (offUrl.length + onUrl.length <= MAX_PAIR_CHARS) return { off: offUrl, on: onUrl, alt, width, height };
    }
    throw new Error("These photos are too detailed to keep in the browser. Pick smaller ones (about 600 × 900 px is plenty).");
  } finally {
    offBitmap.close();
    onBitmap.close();
  }
}
