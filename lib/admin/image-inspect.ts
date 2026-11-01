/*
 * Reads format, pixel size and transparency from the first bytes of a PNG or WebP file, without decoding it and without trusting the
 * type the browser reported. The admin's save action runs it on the first bytes of each uploaded photo before a product uses it.
 */

export type ImageInfo = {
  mime: "image/png" | "image/webp";
  extension: "png" | "webp";
  width: number;
  height: number;
  /** The file can hold transparency (an alpha channel, or a PNG transparency chunk). */
  hasAlpha: boolean;
};

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function u32be(bytes: Uint8Array, at: number) {
  return ((bytes[at] << 24) | (bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]) >>> 0;
}

function u24le(bytes: Uint8Array, at: number) {
  return bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16);
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function inspectPng(bytes: Uint8Array): ImageInfo | null {
  if (bytes.length < 33 || ascii(bytes, 12, 4) !== "IHDR") return null;
  const width = u32be(bytes, 16);
  const height = u32be(bytes, 20);
  const colorType = bytes[25];
  let hasAlpha = colorType === 4 || colorType === 6;
  // Palette and greyscale images can still be transparent through a tRNS chunk, which comes before the image data.
  for (let offset = 8; !hasAlpha && offset + 8 <= bytes.length; ) {
    const length = u32be(bytes, offset);
    const type = ascii(bytes, offset + 4, 4);
    if (type === "tRNS") hasAlpha = true;
    if (type === "IDAT" || type === "IEND") break;
    offset += 12 + length;
  }
  return { mime: "image/png", extension: "png", width, height, hasAlpha };
}

function inspectWebp(bytes: Uint8Array): ImageInfo | null {
  if (bytes.length < 30) return null;
  const chunk = ascii(bytes, 12, 4);
  if (chunk === "VP8X") {
    // Extended format: flags, then 24-bit canvas width and height (minus one).
    return { mime: "image/webp", extension: "webp", width: u24le(bytes, 24) + 1, height: u24le(bytes, 27) + 1, hasAlpha: (bytes[20] & 0x10) !== 0 };
  }
  if (chunk === "VP8L") {
    // Lossless: a 0x2f signature, then 14 bits width-1, 14 bits height-1 and an alpha bit.
    if (bytes[20] !== 0x2f) return null;
    const bits = (bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)) >>> 0;
    return { mime: "image/webp", extension: "webp", width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1, hasAlpha: ((bits >>> 28) & 1) === 1 };
  }
  if (chunk === "VP8 ") {
    // Simple lossy format: never transparent.
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return null;
    return {
      mime: "image/webp",
      extension: "webp",
      width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
      height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
      hasAlpha: false,
    };
  }
  return null;
}

export function inspectImage(bytes: Uint8Array): ImageInfo | null {
  if (PNG_SIGNATURE.every((value, index) => bytes[index] === value)) return inspectPng(bytes);
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return inspectWebp(bytes);
  return null;
}

/** The rules a lamp photo pair must meet before it is stored. The rail depends on them (see docs/ASSETS.md). */
export const PHOTO_RULES = {
  maxBytes: 4 * 1024 * 1024,
  minWidth: 300,
  maxWidth: 4000,
  minHeight: 450,
  maxHeight: 6000,
  /** Portrait, close to the rail's 2:3 frame: the original photos are 557 × 900 (0.62). */
  minRatio: 0.55,
  maxRatio: 0.72,
} as const;

/** Problems that block saving, written for the admin. An empty list means the pair can be stored. */
export function validatePhotoPair(off: ImageInfo | null, on: ImageInfo | null, sizes: { off: number; on: number }): string[] {
  const problems: string[] = [];
  const each = [
    ["switched-off", off, sizes.off],
    ["switched-on", on, sizes.on],
  ] as const;
  for (const [label, info, bytes] of each) {
    if (bytes > PHOTO_RULES.maxBytes) problems.push(`The ${label} photo is ${(bytes / 1048576).toFixed(1)} MB; the limit is 4 MB.`);
    if (!info) {
      problems.push(`The ${label} photo isn't a PNG or WebP file.`);
      continue;
    }
    const ratio = info.width / info.height;
    if (info.width < PHOTO_RULES.minWidth || info.height < PHOTO_RULES.minHeight) {
      problems.push(`The ${label} photo is ${info.width} × ${info.height} px; it needs to be at least ${PHOTO_RULES.minWidth} × ${PHOTO_RULES.minHeight} px.`);
    } else if (info.width > PHOTO_RULES.maxWidth || info.height > PHOTO_RULES.maxHeight) {
      problems.push(`The ${label} photo is ${info.width} × ${info.height} px; keep it within ${PHOTO_RULES.maxWidth} × ${PHOTO_RULES.maxHeight} px.`);
    } else if (ratio < PHOTO_RULES.minRatio || ratio > PHOTO_RULES.maxRatio) {
      problems.push(`The ${label} photo is ${info.width} × ${info.height} px. Lamp photos need a portrait canvas close to 2:3 (for example 600 × 900).`);
    }
    if (!info.hasAlpha) problems.push(`The ${label} photo has no transparent background. Export the cut-out as PNG or WebP with transparency.`);
  }
  if (off && on && (off.width !== on.width || off.height !== on.height)) {
    problems.push(
      `The two photos have different canvases (${off.width} × ${off.height} and ${on.width} × ${on.height} px). Export both from the same frame so the light switches on in place.`,
    );
  }
  return problems;
}
