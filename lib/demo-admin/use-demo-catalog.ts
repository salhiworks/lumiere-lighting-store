"use client";

import * as React from "react";
import type { CartProduct } from "@/lib/catalog/types";
import { PUBLIC_DEMO } from "@/lib/public-demo";
import { applyEdits, demoStore, type DemoState } from "./store";

/*
 * How the demo storefront shows the visitor's dashboard edits. The server renders the built-in catalog; after hydration these hooks
 * layer the edits from this browser's localStorage on top, and add the published products the visitor created. In a normal build
 * PUBLIC_DEMO is false, so the hooks return their input untouched and never read storage.
 */

const noSubscription = () => () => {};
const noEdits = () => demoStore.getServerSnapshot();

export function useDemoEdits(): DemoState {
  return React.useSyncExternalStore(PUBLIC_DEMO ? demoStore.subscribe : noSubscription, PUBLIC_DEMO ? demoStore.getSnapshot : noEdits, demoStore.getServerSnapshot);
}

/**
 * Visible products with the edits applied, then the visitor's own published products: what a visitor of the demo storefront sees.
 * Every caller passes full products or the cart's slice of them; a created product is a full product, so it fits either shape.
 */
export function useDemoProducts<T extends CartProduct & { published?: boolean }>(base: T[]): T[] {
  const edits = useDemoEdits();
  return React.useMemo(() => {
    if (!PUBLIC_DEMO) return base;
    const shown = applyEdits(base, edits).filter((item) => item.published !== false && edits.products[item.id]?.published !== false);
    const created = Object.values(edits.created).filter((product) => product.published) as unknown as T[];
    return created.length ? [...shown, ...created] : shown;
  }, [base, edits]);
}
