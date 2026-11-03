"use client";

import * as React from "react";
import { PUBLIC_DEMO } from "@/lib/public-demo";
import { applyEdits, demoStore, type DemoState } from "./store";

/*
 * How the demo storefront shows the visitor's dashboard edits. The server renders the built-in catalog; after hydration these hooks
 * layer the edits from this browser's localStorage on top. In a normal build PUBLIC_DEMO is false, so the hooks return their input
 * untouched and never read storage.
 */

const noSubscription = () => () => {};
const noEdits = () => demoStore.getServerSnapshot();

export function useDemoEdits(): DemoState {
  return React.useSyncExternalStore(PUBLIC_DEMO ? demoStore.subscribe : noSubscription, PUBLIC_DEMO ? demoStore.getSnapshot : noEdits, demoStore.getServerSnapshot);
}

/** Visible products with the edits applied: what a visitor of the demo storefront should see. */
export function useDemoProducts<T extends { id: string; published?: boolean }>(base: T[]): T[] {
  const edits = useDemoEdits();
  return React.useMemo(() => {
    if (!PUBLIC_DEMO) return base;
    return applyEdits(base, edits).filter((item) => item.published !== false && edits.products[item.id]?.published !== false);
  }, [base, edits]);
}
