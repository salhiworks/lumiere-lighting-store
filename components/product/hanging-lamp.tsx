"use client";

import * as React from "react";
import { cn } from "cn";

/*
 * A lamp that hangs from the top of its box and sways a little when the pointer brushes past, an echo of the rail's pendulums.
 * The swing runs as a Web Animation, so it always finishes on its own instead of snapping back when the pointer leaves.
 */
export function HangingLamp({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);

  const swing = (event: React.PointerEvent) => {
    const lamp = ref.current;
    if (!lamp || event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (lamp.getAnimations().some((animation) => animation.playState === "running")) return;
    const box = lamp.getBoundingClientRect();
    /* Pushed from the left, the shade swings right: with the pivot at the top, that is a negative rotation. */
    const side = event.clientX < box.left + box.width / 2 ? -1 : 1;
    lamp.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: `rotate(${side * 1.8}deg)`, offset: 0.18 },
        { transform: `rotate(${side * -1.2}deg)`, offset: 0.42 },
        { transform: `rotate(${side * 0.6}deg)`, offset: 0.66 },
        { transform: `rotate(${side * -0.2}deg)`, offset: 0.86 },
        { transform: "rotate(0deg)" },
      ],
      { duration: 1700, easing: "ease-in-out" },
    );
  };

  return (
    <span ref={ref} onPointerEnter={swing} className={cn("absolute inset-0 block origin-top", className)}>
      {children}
    </span>
  );
}
