/*
 * The cart is a list of product IDs and quantities kept in localStorage. Names, prices and stock always come from the current
 * catalog (the store layout passes a snapshot to the browser), never from storage, so a refreshed page cannot show a stale price.
 * At checkout only these IDs and quantities go to the server, which prices them itself.
 *
 * The store is plain TypeScript (no React) and is read through useSyncExternalStore in components/cart/use-cart.ts: the server
 * snapshot is always empty, so server HTML and the first client render match and hydration never fails.
 */

export type CartLine = { productId: string; quantity: number };

export const CART_STORAGE_KEY = "lumiere.cart.v1";

/** Hard ceiling for one line, whatever the stock. Stock limits are applied when lines are joined with the catalog. */
export const MAX_LINE_QUANTITY = 10;

const EMPTY: CartLine[] = [];
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Turns whatever is in storage into valid lines: malformed entries are dropped, duplicates merged, quantities capped. */
export function parseCart(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY;
  }
  if (!Array.isArray(data)) return EMPTY;
  const merged = new Map<string, number>();
  for (const entry of data) {
    if (!entry || typeof entry !== "object") continue;
    const { productId, quantity } = entry as Record<string, unknown>;
    if (typeof productId !== "string" || !ID_PATTERN.test(productId) || typeof quantity !== "number" || !Number.isFinite(quantity)) continue;
    const total = Math.min(MAX_LINE_QUANTITY, (merged.get(productId) ?? 0) + Math.floor(quantity));
    if (total > 0) merged.set(productId, total);
  }
  return merged.size ? Array.from(merged, ([productId, quantity]) => ({ productId, quantity })) : EMPTY;
}

let lines: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/* Read storage once, lazily, before the first read or write, so a write can never replace a saved cart with an empty one. */
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    lines = parseCart(window.localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    lines = EMPTY;
  }
}

function commit(next: CartLine[]) {
  lines = next.length ? next : EMPTY;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage is full or blocked (private mode): the cart still works until the tab closes.
  }
  emit();
}

/* Another tab changed the cart (or cleared storage): adopt its value. */
function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== CART_STORAGE_KEY) return;
  lines = parseCart(event.newValue);
  emit();
}

export const cartStore = {
  subscribe(listener: () => void) {
    if (listeners.size === 0) window.addEventListener("storage", onStorage);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) window.removeEventListener("storage", onStorage);
    };
  },

  getSnapshot(): CartLine[] {
    load();
    return lines;
  },

  getServerSnapshot(): CartLine[] {
    return EMPTY;
  },

  /** Adds up to `quantity` units without passing `max` (the product's limit). Returns how many were actually added. */
  add(productId: string, quantity: number, max: number): number {
    load();
    const limit = Math.min(MAX_LINE_QUANTITY, Math.max(0, Math.floor(max)));
    const current = lines.find((line) => line.productId === productId)?.quantity ?? 0;
    const next = Math.min(limit, current + Math.max(0, Math.floor(quantity)));
    if (next <= current) return 0;
    commit(
      current
        ? lines.map((line) => (line.productId === productId ? { ...line, quantity: next } : line))
        : [...lines, { productId, quantity: next }],
    );
    return next - current;
  },

  /** Sets a line's quantity, capped at `max`. Zero or less removes the line. */
  setQuantity(productId: string, quantity: number, max: number) {
    load();
    const next = Math.min(MAX_LINE_QUANTITY, Math.floor(max), Math.floor(quantity));
    if (next <= 0) return cartStore.remove(productId);
    commit(lines.map((line) => (line.productId === productId ? { ...line, quantity: next } : line)));
  },

  remove(productId: string) {
    load();
    commit(lines.filter((line) => line.productId !== productId));
  },

  /** Empties the cart, once an order for it has been paid. */
  clear() {
    load();
    if (lines.length) commit([]);
  },
};
