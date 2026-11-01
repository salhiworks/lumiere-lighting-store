/*
 * Advisory checks for a lamp photo pair, run on raw RGBA pixels. The admin runs them in the browser as soon as photos are picked,
 * so problems show before saving; they warn but never block (the server enforces the hard rules in image-inspect.ts).
 * Thresholds were calibrated on the eight original pairs, which all pass.
 */

export type Pixels = { data: Uint8ClampedArray | Uint8Array; width: number; height: number };

export type PairCheck = { id: string; ok: boolean; title: string; detail: string };

const SOLID = 24;

type Bounds = { left: number; top: number; right: number; bottom: number };

function bounds({ data, width, height }: Pixels): Bounds | null {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > SOLID) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  return right < 0 ? null : { left, top, right, bottom };
}

function cornersTransparent({ data, width, height }: Pixels) {
  const alphaAt = (x: number, y: number) => data[(y * width + x) * 4 + 3];
  return [alphaAt(0, 0), alphaAt(width - 1, 0), alphaAt(0, height - 1), alphaAt(width - 1, height - 1)].every((alpha) => alpha < 16);
}

/** Where the cord crosses the top rows: its centre and width as fractions of the canvas width. */
function cordAtTop({ data, width, height }: Pixels) {
  const y = Math.max(0, Math.round(height * 0.015));
  let first = -1;
  let last = -1;
  for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 128) {
      if (first < 0) first = x;
      last = x;
    }
  }
  return first < 0 ? null : { centre: (first + last) / 2 / width, width: (last - first + 1) / width };
}

/** Share of the two silhouettes that overlaps (intersection over union of their solid pixels). */
function overlap(a: Pixels, b: Pixels) {
  let both = 0;
  let either = 0;
  for (let i = 3; i < a.data.length; i += 4) {
    const inA = a.data[i] > SOLID;
    const inB = b.data[i] > SOLID;
    if (inA && inB) both++;
    if (inA || inB) either++;
  }
  return either ? both / either : 0;
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

/** Both images must be drawn at the same size (scale them to one canvas first). */
export function analysePair(off: Pixels, on: Pixels): PairCheck[] {
  const checks: PairCheck[] = [];
  const transparent = cornersTransparent(off) && cornersTransparent(on);
  checks.push({
    id: "transparent",
    ok: transparent,
    title: transparent ? "Transparent background" : "The background may not be transparent",
    detail: transparent ? "The corners are clear, so the lamp sits directly on the page." : "Opaque corners show as a box around the lamp on the rail.",
  });

  const cord = cordAtTop(off);
  const cordOk = Boolean(cord && Math.abs(cord.centre - 0.5) <= 0.04 && cord.width <= 0.08);
  checks.push({
    id: "cord",
    ok: cordOk,
    title: cordOk ? "Cord starts at the top centre" : "No cord found at the top centre",
    detail: cordOk
      ? "The rail extends this cord up to the track."
      : cord
        ? `Something crosses the top edge at ${percent(cord.centre)} of the width. The cord should leave the top edge in the middle.`
        : "Nothing touches the top edge. The cord must start at the top of the canvas, centred, so the rail can hang the lamp.",
  });

  const offBox = bounds(off);
  const onBox = bounds(on);
  const lowest = offBox ? (offBox.bottom + 1) / off.height : 0;
  const bottomOk = Boolean(offBox) && lowest <= 0.85;
  checks.push({
    id: "scale",
    ok: bottomOk,
    title: bottomOk ? "Lamp sits at the usual height" : "The lamp reaches very low on the canvas",
    detail: offBox
      ? `The shade ends at ${percent(lowest)} of the height (the originals end between 70% and 78%). Lower lamps look larger than their neighbours.`
      : "The switched-off photo looks empty.",
  });

  if (offBox && onBox) {
    const drift = Math.max(
      Math.abs(offBox.left - onBox.left),
      Math.abs(offBox.right - onBox.right),
      Math.abs(offBox.top - onBox.top),
      Math.abs(offBox.bottom - onBox.bottom),
    );
    const iou = overlap(off, on);
    const aligned = drift / off.width <= 0.02 && iou >= 0.9;
    checks.push({
      id: "aligned",
      ok: aligned,
      title: aligned ? "The pair lines up" : "The two photos may not line up",
      detail: aligned
        ? `The silhouettes overlap ${percent(iou)} and their edges are within ${drift} px.`
        : `The silhouettes overlap ${percent(iou)} and their edges drift by up to ${drift} px. Use Overlay to see where they differ; the lamp would jump when it lights.`,
    });
  }
  return checks;
}
