"use client";

import * as React from "react";
import Link from "next/link";
import { useCartDrawer } from "@/components/cart/cart-provider";
import { buttonVariants } from "@/components/ui/button";
import { PendantLampRail, type PendantLamp, type PendantLampDetailContext, type PendantLampRailLabels } from "@/components/ui/pendant-lamp-rail";
import { LampDetailActions } from "./lamp-detail-actions";

const LABELS: PendantLampRailLabels = { close: "Close", dimmer: "Dimmer", open: "Lift to view" };

type Glow = { x: number; on: boolean };

/*
 * The homepage showpiece: the Pendant Lamp Rail, fed from the catalog, with store actions inside its own detail view.
 * Everything here goes through the rail's public props; its physics and animation are untouched.
 *
 * The room around the rail answers the lamps: whichever pendant is lit warms the wall behind it, and the warmth glides along as the
 * visitor brushes the track. It reads the lit lamp from `onActiveChange` and its position from the rail's own [data-lamp] buttons,
 * and moves one transformed layer (no layout, no per-frame work), so it costs nothing while the physics run.
 */
export function LampRailHero({ items, intro }: { items: PendantLamp[]; intro: React.ReactNode }) {
  const { openCart } = useCartDrawer();
  const railRef = React.useRef<HTMLElement>(null);
  const roomRef = React.useRef<HTMLDivElement>(null);
  const [autoplay, setAutoplay] = React.useState(true);
  const [glow, setGlow] = React.useState<Glow>({ x: 50, on: false });
  const lit = React.useRef(0);
  const cartAfterClose = React.useRef(false);

  /*
   * Autoplay lights the pendants one by one until the visitor touches the rail (the rail stops it itself). It also stops for good after
   * one full pass, or once the rail scrolls out of view, so the caption's live region and the animation frames don't run on forever.
   */
  React.useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) setAutoplay(false);
    });
    observer.observe(rail);
    return () => observer.disconnect();
  }, []);

  const onActiveChange = React.useCallback(
    (index: number | null) => {
      const room = roomRef.current;
      const lamp = index === null ? null : railRef.current?.querySelector<HTMLElement>(`[data-lamp="${index}"]`);
      if (room && lamp) {
        const box = room.getBoundingClientRect();
        const slot = lamp.getBoundingClientRect();
        const x = box.width ? ((slot.left + slot.width / 2 - box.left) / box.width) * 100 : 50;
        setGlow({ x: Math.max(0, Math.min(100, x)), on: true });
      } else {
        setGlow((old) => ({ ...old, on: false }));
      }
      if (index === null) return;
      lit.current += 1;
      if (lit.current >= items.length) setAutoplay(false);
    },
    [items.length],
  );

  /* "View cart" closes the lamp detail first; the drawer opens once the rail has handed focus back to the pendant, never on top. */
  const onOpenChange = React.useCallback(
    (index: number | null) => {
      if (index !== null || !cartAfterClose.current) return;
      cartAfterClose.current = false;
      window.setTimeout(openCart, 60);
    },
    [openCart],
  );

  const detailAction = React.useCallback(
    (item: PendantLamp, { close }: PendantLampDetailContext) => (
      <LampDetailActions
        productId={item.id}
        onViewCart={() => {
          cartAfterClose.current = true;
          close();
        }}
      />
    ),
    [],
  );

  return (
    <div ref={roomRef} className="relative isolate overflow-hidden">
      {/* The room: a soft ceiling light from above, and the lit pendant's warmth on the wall behind the rail. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_60%_at_50%_0%,var(--card),transparent_70%),linear-gradient(to_bottom,var(--background),color-mix(in_oklab,var(--secondary)_55%,var(--background)))]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-full transition-[transform,opacity] duration-[1100ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(${glow.x - 50}%)`, opacity: glow.on ? 1 : 0 }}
      >
        <span className="absolute left-1/2 top-[48%] h-[78%] w-[min(46rem,80%)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--glow)_42%,transparent),color-mix(in_oklab,var(--glow)_12%,transparent)_55%,transparent)]" />
      </div>

      {intro}

      <PendantLampRail
        ref={railRef}
        items={items}
        caption="Brush along the track to light a pendant."
        autoplay={autoplay}
        onActiveChange={onActiveChange}
        onOpenChange={onOpenChange}
        labels={LABELS}
        detailAction={detailAction}
        action={
          <Link href="/shop" className={buttonVariants()}>
            Shop all pendants
          </Link>
        }
        className="mx-auto max-w-[1600px] bg-transparent!"
      />

      <GestureGuide />
    </div>
  );
}

/* How to play with the rail, said once and quietly: three gestures, each with the thing it does. */
function GestureGuide() {
  const steps = [
    { key: "Brush", wide: "Brush the track", narrow: null, does: "lights a pendant" },
    { key: "Drag", wide: "Drag a lamp", narrow: null, does: "it swings on its cord" },
    { key: "Lift", wide: "Lift to view", narrow: "Lift to view", does: "dim it, add it to the cart" },
  ];
  return (
    <ol aria-label="How to use the lighting track" className="shell relative grid gap-3 pb-10 pt-1 text-[12.5px] md:grid-cols-3 md:gap-8 md:pb-20">
      {steps.map((step) => (
        <li key={step.key} className={step.narrow ? "flex items-baseline gap-3 border-t border-foreground/12 pt-3 sm:block" : "hidden items-baseline gap-3 border-t border-foreground/12 pt-3 md:block"}>
          <span className="font-mono text-[11px] text-brass-deep">{step.key === "Brush" ? "01" : step.key === "Drag" ? "02" : "03"}</span>
          <span className="md:mt-1.5 md:block">
            <span className="font-medium text-foreground">
              <span className="hidden md:inline">{step.wide}</span>
              <span className="md:hidden">{step.narrow}</span>
            </span>
            <span className="text-muted-foreground"> — {step.does}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/*
 * Phones only: the rail is a swipeable carousel there, so the first screen says so in one line, right under the headline, with the
 * pendant dot the carousel uses and an arrow that drifts the way to swipe (still with reduced motion). The full guide sits below the rail.
 */
export function SwipeCue() {
  return (
    <p className="mx-auto mt-4 inline-flex items-center gap-2.5 rounded-full border border-foreground/12 bg-card/70 px-3.5 py-1.5 text-[12.5px] font-medium text-foreground/80 shadow-[0_1px_2px_rgb(35_32_28/0.06)] backdrop-blur sm:hidden">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-brass shadow-[0_0_8px_2px_color-mix(in_oklab,var(--glow)_70%,transparent)]" />
      Swipe the rail to light each pendant
      <span aria-hidden="true" className="inline-block animate-[swipe-hint_2.4s_ease-in-out_infinite] text-brass-deep motion-reduce:animate-none">
        →
      </span>
    </p>
  );
}
