"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "cn";
import type { ProductImages } from "@/lib/catalog/types";
import { HangingLamp } from "./hanging-lamp";
import { LampImage } from "./lamp-image";

export type Room = "day" | "evening";

/*
 * A lamp hung in a small room: the product's paired photos, a table it lights, and the room's own light. Everything follows one
 * dimmer level (0–1), so the lit photo, the pool on the table and the warmth of the room always agree. Shared by the product page,
 * the homepage's after-dark scene and the admin's previews, so the owner previews exactly what visitors see.
 *
 * Plain layers and opacity only: no canvas, no per-frame JavaScript. The photos are never resized or re-encoded (LampImage).
 */
type LightStageProps = {
  images: ProductImages;
  /** Dimmer level, 0 (off) to 1 (full). */
  level: number;
  room?: Room;
  /** Sways when the pointer brushes past, like the product cards. */
  sway?: boolean;
  eager?: boolean;
  className?: string;
  /** Extra content on top of the stage, such as a label. */
  children?: React.ReactNode;
};

export function LightStage({ images, level, room = "day", sway = true, eager = false, className, children }: LightStageProps) {
  const night = room === "evening";
  const light = Math.max(0, Math.min(1, level));
  // Perceived brightness: a dimmer at 50% looks more than half as bright, as with real dimmers.
  const glow = Math.pow(light, 0.7);
  const lamp = <LampImage product={{ images }} lit={light} eager={eager} className="left-[15%] top-0 w-[70%]" />;
  return (
    <div
      data-room={room}
      className={cn(
        "relative isolate aspect-[4/5] overflow-hidden rounded-[inherit] transition-colors duration-700 motion-reduce:transition-none",
        night ? "bg-night" : "bg-secondary/70",
        className,
      )}
    >
      {/* The room: daylight keeps a soft halo; in the evening the lamp is the only light, so the walls warm up with it. */}
      <span
        aria-hidden="true"
        className={cn("room-glow absolute inset-x-[-20%] top-[-6%] h-[100%] transition-opacity duration-500 motion-reduce:transition-none")}
        style={{ opacity: night ? glow * 0.85 : 0.25 + glow * 0.45 }}
      />
      {/* The table the light falls on. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 bottom-0 h-[19%] border-t transition-colors duration-700 motion-reduce:transition-none",
          night ? "border-night-line bg-night-raised" : "border-foreground/10 bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--secondary)_92%,var(--foreground)),var(--secondary))]",
        )}
      />
      <span
        aria-hidden="true"
        className="light-pool absolute left-1/2 top-[74%] h-[16%] w-[86%] transition-[opacity,transform] duration-500 motion-reduce:transition-none"
        style={{ opacity: glow * (night ? 1 : 0.9), transform: `translateX(-50%) scaleX(${0.75 + glow * 0.25})` }}
      />
      {/* The cone of light between the shade and the table, visible only in a dark room. */}
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-[52%] h-[30%] w-[64%] -translate-x-1/2 transition-opacity duration-500 [clip-path:polygon(32%_0,68%_0,100%_100%,0_100%)] motion-reduce:transition-none"
        style={{
          opacity: night ? glow * 0.55 : 0,
          background: "linear-gradient(to bottom, color-mix(in oklab, var(--glow) 55%, transparent), transparent)",
        }}
      />
      <span aria-hidden="true" className="ceiling-canopy absolute left-1/2 top-0 z-10 w-10 -translate-x-1/2" />
      {sway ? <HangingLamp>{lamp}</HangingLamp> : <span className="absolute inset-0 block">{lamp}</span>}
      {children}
    </div>
  );
}

/** Light state for a stage: on/off remembers the last dimmer level, as a real dimmer switch does. */
export function useLight(initial = 1) {
  const [level, setLevelState] = React.useState(initial);
  const last = React.useRef(initial > 0 ? initial : 1);
  const setLevel = React.useCallback((value: number) => {
    const next = Math.max(0, Math.min(1, value));
    if (next > 0) last.current = next;
    setLevelState(next);
  }, []);
  const toggle = React.useCallback(() => setLevelState((value) => (value > 0 ? 0 : last.current)), []);
  return { level, on: level > 0, setLevel, toggle };
}

type LightControlsProps = {
  level: number;
  onLevel: (value: number) => void;
  onToggle: () => void;
  room?: Room;
  onRoom?: (room: Room) => void;
  /** Names the lamp for assistive technology, e.g. "Enamel dome · Forest". */
  label: string;
  /** "night" draws the controls for a dark surface. */
  surface?: "day" | "night";
  className?: string;
};

/* The stage's switch, dimmer and (optionally) the room: day or evening. All native controls, so keyboard and screen readers just work. */
export function LightControls({ level, onLevel, onToggle, room, onRoom, label, surface = "day", className }: LightControlsProps) {
  const on = level > 0;
  const percent = Math.round(level * 100);
  const dark = surface === "night";
  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-3", dark ? "text-night-foreground" : "text-foreground", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`Light, ${label}`}
        onClick={onToggle}
        className="inline-flex h-10 shrink-0 items-center gap-3 rounded-full text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          aria-hidden="true"
          className={cn(
            "relative h-6 w-11 rounded-full border transition-colors duration-300 motion-reduce:transition-none",
            on ? "border-brass bg-brass" : dark ? "border-night-line bg-night-raised" : "border-foreground/20 bg-secondary",
          )}
        >
          <span
            className={cn(
              "absolute top-1/2 size-[18px] -translate-y-1/2 rounded-full bg-card shadow-[0_1px_3px_rgb(35_32_28/0.3)] transition-[left] duration-300 motion-reduce:transition-none",
              on ? "left-[calc(100%-21px)]" : "left-[2px]",
            )}
          />
        </span>
        <span className="w-7 text-left tabular-nums">{on ? "On" : "Off"}</span>
      </button>

      <label className="flex min-w-[10rem] flex-1 items-center gap-3 text-[13px]">
        <span className={cn("eyebrow", dark && "text-night-muted")}>Dimmer</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={percent}
          aria-valuetext={on ? `${percent}%` : "Off"}
          onChange={(event) => onLevel(Number(event.currentTarget.value) / 100)}
          className="dimmer min-w-0 flex-1"
          style={{ "--fill": `${percent}%`, "--fill-n": level } as React.CSSProperties}
        />
        <span className={cn("w-9 text-right font-mono text-[12px] tabular-nums", dark ? "text-night-muted" : "text-muted-foreground")}>{on ? `${percent}%` : "Off"}</span>
      </label>

      {room && onRoom && (
        <div role="group" aria-label="Room" className={cn("inline-flex rounded-full border p-0.5", dark ? "border-night-line" : "border-foreground/15")}>
          {(["day", "evening"] as const).map((value) => {
            const Icon = value === "day" ? Sun : Moon;
            const active = room === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => onRoom(value)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium capitalize outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                  active ? (dark ? "bg-night-foreground text-night" : "bg-foreground text-background") : dark ? "text-night-muted hover:text-night-foreground" : "text-foreground/70 hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {value}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
