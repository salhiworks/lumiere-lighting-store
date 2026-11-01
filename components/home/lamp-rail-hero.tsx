"use client";

import * as React from "react";
import Link from "next/link";
import { useCartDrawer } from "@/components/cart/cart-provider";
import { buttonVariants } from "@/components/ui/button";
import { PendantLampRail, type PendantLamp, type PendantLampDetailContext, type PendantLampRailLabels } from "@/components/ui/pendant-lamp-rail";
import { LampDetailActions } from "./lamp-detail-actions";

const LABELS: PendantLampRailLabels = { close: "Close", dimmer: "Dimmer", open: "Lift to view" };

/*
 * The homepage showpiece: the Pendant Lamp Rail, fed from the catalog, with store actions inside its own detail view.
 * Everything here goes through the rail's public props; its physics and animation are untouched.
 */
export function LampRailHero({ items }: { items: PendantLamp[] }) {
  const { openCart } = useCartDrawer();
  const railRef = React.useRef<HTMLElement>(null);
  const [autoplay, setAutoplay] = React.useState(true);
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
    <PendantLampRail
      ref={railRef}
      items={items}
      caption="Brush along the track to light a pendant, slide it along, lift it to dim."
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
      className="mx-auto max-w-[1600px]"
    />
  );
}
