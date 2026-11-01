"use client";

import * as React from "react";
import { AlertTriangle, Check, ImageUp } from "lucide-react";
import { cn } from "cn";
import { PHOTO_RULES } from "@/lib/admin/image-inspect";
import { analysePair, type PairCheck, type Pixels } from "@/lib/admin/pair-analysis";
import type { ProductImages } from "@/lib/catalog/types";

type Picked = { file: File; url: string; width: number; height: number };
type View = "off" | "on" | "overlay";

const ACCEPT = "image/png,image/webp";

/*
 * Picks the switched-off and switched-on photos, previews them exactly as the store will (same box, same fit), and checks the pair
 * in the browser before anything is uploaded. The checks here are advice; the server enforces the hard rules again on save.
 */
export function PhotoPairField({ current, error }: { current?: ProductImages; error?: string }) {
  const [off, setOff] = React.useState<Picked | null>(null);
  const [on, setOn] = React.useState<Picked | null>(null);
  const [view, setView] = React.useState<View>("on");
  const [analysis, setAnalysis] = React.useState<{ key: string; checks: PairCheck[] } | null>(null);
  /* The server's last verdict on the photos stops showing once different photos are picked; the checks below take over. */
  const [answeredError, setAnsweredError] = React.useState<string | undefined>();
  const offInput = React.useRef<HTMLInputElement>(null);
  const onInput = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!off) return;
    const url = off.url;
    return () => URL.revokeObjectURL(url);
  }, [off]);
  React.useEffect(() => {
    if (!on) return;
    const url = on.url;
    return () => URL.revokeObjectURL(url);
  }, [on]);

  const pairKey = off && on ? `${off.url} ${on.url}` : null;
  React.useEffect(() => {
    if (!off || !on) return;
    let cancelled = false;
    analyseFiles(off, on).then((checks) => {
      if (!cancelled) setAnalysis({ key: `${off.url} ${on.url}`, checks });
    });
    return () => {
      cancelled = true;
    };
  }, [off, on]);
  const checks = analysis && analysis.key === pairKey ? analysis.checks : null;

  const choose = async (which: "off" | "on", file: File | undefined) => {
    setAnsweredError(error);
    const set = which === "off" ? setOff : setOn;
    if (!file) return set(null);
    const size = await imageSize(file);
    set({ file, url: URL.createObjectURL(file), ...size });
  };

  const clear = () => {
    setAnsweredError(error);
    for (const input of [offInput.current, onInput.current]) if (input) input.value = "";
    setOff(null);
    setOn(null);
  };

  const problems = blockingProblems(off, on);
  const picked = Boolean(off || on);
  const preview = off && on ? { off: off.url, on: on.url, width: off.width, height: off.height } : !picked && current ? current : null;
  const errorId = "photos-error";
  const serverError = error && error !== answeredError ? error : undefined;

  return (
    <div className="flex flex-col gap-4" aria-describedby={serverError ? errorId : undefined}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-secondary/70">
        {preview ? (
          <>
            <span aria-hidden="true" className="ceiling-canopy absolute left-1/2 top-0 z-10 w-9 -translate-x-1/2" />
            <span
              aria-hidden="true"
              className={cn("light-pool absolute left-1/2 top-[46%] h-[54%] w-full -translate-x-1/2 transition-opacity duration-500 motion-reduce:transition-none", view === "on" ? "opacity-100" : "opacity-0")}
            />
            <span className="absolute left-[15%] top-0 block w-[70%]" style={{ aspectRatio: `${preview.width} / ${preview.height}` }}>
              <img src={preview.off} alt="Switched-off photo" className="absolute inset-0 size-full object-contain object-top" />
              <img
                src={preview.on}
                alt="Switched-on photo"
                className={cn("absolute inset-0 size-full object-contain object-top transition-opacity duration-500 motion-reduce:transition-none", view === "off" ? "opacity-0" : "opacity-100")}
              />
              {view === "overlay" && (
                <img src={preview.off} alt="" aria-hidden="true" className="absolute inset-0 size-full object-contain object-top opacity-50" />
              )}
            </span>
            <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
              {picked ? "New photos · not saved yet" : "Current photos"}
            </span>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center text-sm text-muted-foreground">
            <ImageUp className="size-6" aria-hidden="true" />
            {picked ? "Pick the other photo of the pair to see the preview." : "Pick the two photos of the pair to preview them here."}
          </div>
        )}
      </div>

      <div role="group" aria-label="Preview" className="inline-flex self-start rounded-full border border-foreground/15 p-0.5">
        {(
          [
            ["off", "Off"],
            ["on", "On"],
            ["overlay", "Overlay"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            onClick={() => setView(value)}
            className={cn(
              "h-8 rounded-full px-3.5 text-[12.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
              view === value ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {view === "overlay" && <p className="-mt-2 text-[12.5px] text-muted-foreground">The off photo at half strength over the on photo. Doubled edges mean the pair doesn’t line up.</p>}

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["off", "Switched off", off, offInput],
            ["on", "Switched on", on, onInput],
          ] as const
        ).map(([which, label, file, ref]) => (
          <label
            key={which}
            className="flex cursor-pointer flex-col gap-1 rounded-lg border border-dashed border-foreground/25 px-3.5 py-3 transition-colors hover:border-foreground/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring motion-reduce:transition-none"
          >
            <span className="text-[13px] font-medium">{label}</span>
            <span className="truncate text-[12px] text-muted-foreground">{file ? `${file.file.name} · ${file.width} × ${file.height}` : "Choose PNG or WebP"}</span>
            <input
              ref={ref}
              type="file"
              name={which === "off" ? "imageOff" : "imageOn"}
              accept={ACCEPT}
              className="sr-only"
              onChange={(event) => void choose(which, event.currentTarget.files?.[0])}
            />
          </label>
        ))}
      </div>
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
        Transparent PNG or WebP, up to 4 MB each, both on the same portrait canvas (the originals are 557 × 900). Cord from the top centre;
        only the light should change between the two.
        {picked && (
          <>
            {" "}
            <button type="button" onClick={clear} className="font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {current ? "Keep the current photos" : "Clear"}
            </button>
          </>
        )}
      </p>

      {(problems.length > 0 || checks) && (
        <ul aria-live="polite" className="flex flex-col gap-2 border-t border-foreground/15 pt-4">
          {problems.map((problem) => (
            <CheckRow key={problem} ok={false} blocking title={problem} />
          ))}
          {checks?.map((check) => (
            <CheckRow key={check.id} ok={check.ok} title={check.title} detail={check.detail} />
          ))}
        </ul>
      )}
      {serverError && (
        <p id={errorId} role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-[13px] leading-relaxed text-destructive">
          {serverError}
        </p>
      )}
    </div>
  );
}

function CheckRow({ ok, title, detail, blocking = false }: { ok: boolean; title: string; detail?: string; blocking?: boolean }) {
  return (
    <li className="grid grid-cols-[1.25rem_1fr] gap-2 text-[13px] leading-snug">
      {ok ? (
        <Check className="mt-0.5 size-4 text-[oklch(0.55_0.09_150)]" aria-label="Passed" />
      ) : (
        <AlertTriangle className={cn("mt-0.5 size-4", blocking ? "text-destructive" : "text-brass-deep")} aria-label={blocking ? "Problem" : "Warning"} />
      )}
      <span>
        <span className={cn("font-medium", blocking && "text-destructive")}>{title}</span>
        {detail && <span className="block text-muted-foreground">{detail}</span>}
      </span>
    </li>
  );
}

/* The same hard rules the server applies, checked as soon as files are picked. */
function blockingProblems(off: Picked | null, on: Picked | null): string[] {
  const problems: string[] = [];
  if (Boolean(off) !== Boolean(on)) problems.push("Pick both photos: the pair is always replaced together.");
  for (const [label, picked] of [
    ["switched-off", off],
    ["switched-on", on],
  ] as const) {
    if (!picked) continue;
    if (picked.file.type && !ACCEPT.split(",").includes(picked.file.type)) problems.push(`The ${label} photo must be PNG or WebP.`);
    if (picked.file.size > PHOTO_RULES.maxBytes) problems.push(`The ${label} photo is larger than 4 MB.`);
    const ratio = picked.width / picked.height;
    if (picked.width && (ratio < PHOTO_RULES.minRatio || ratio > PHOTO_RULES.maxRatio)) problems.push(`The ${label} photo isn’t a portrait close to 2:3.`);
    if (picked.width && (picked.width < PHOTO_RULES.minWidth || picked.height < PHOTO_RULES.minHeight)) problems.push(`The ${label} photo is too small.`);
  }
  if (off && on && (off.width !== on.width || off.height !== on.height)) {
    problems.push(`The photos have different canvases (${off.width} × ${off.height} and ${on.width} × ${on.height}).`);
  }
  return problems;
}

/** A picked photo's pixel size, read by the browser (0 × 0 if it can't decode it; the server checks the real file anyway). */
export async function imageSize(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: 0, height: 0 };
  }
}

/* Draws both photos onto the same small canvas and runs the advisory checks on their pixels. */
async function analyseFiles(off: Picked, on: Picked): Promise<PairCheck[]> {
  try {
    const [a, b] = await Promise.all([createImageBitmap(off.file), createImageBitmap(on.file)]);
    const height = Math.min(450, a.height);
    const width = Math.max(1, Math.round((a.width * height) / a.height));
    const read = (bitmap: ImageBitmap): Pixels => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(bitmap, 0, 0, width, height);
      return context.getImageData(0, 0, width, height);
    };
    const checks = analysePair(read(a), read(b));
    a.close();
    b.close();
    return checks;
  } catch {
    return [{ id: "unreadable", ok: false, title: "These photos couldn’t be read in the browser", detail: "The server will still check them when you save." }];
  }
}
