import type { Product } from "@/lib/catalog/types";

/*
 * The public demo's "database": edits made in the Demo Admin Dashboard, kept in this browser's localStorage and nowhere else.
 * It stores only what a visitor changed (a partial product per ID, plus order shipping states), so the built-in catalog stays the
 * source of everything else and Reset Demo is just deleting one key. Plain TypeScript, read through useSyncExternalStore like the
 * cart (lib/cart.ts): the server snapshot is always empty, so hydration never mismatches.
 *
 * Nothing here talks to a server. Every caller is gated by PUBLIC_DEMO, so a normal build never reads or writes this key.
 */

export const DEMO_STORAGE_KEY = "lumiere.demo-admin.v1";

/** The product fields a visitor can change in the demo dashboard. Anything else (slug, id, specs…) always comes from the catalog. */
export const EDITABLE_FIELDS = ["name", "finish", "collection", "summary", "description", "priceCents", "stock", "highlights", "drop", "images", "published"] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];
export type ProductPatch = Partial<Pick<Product, EditableField>>;

export type FulfillmentState = "unfulfilled" | "shipped" | "delivered";

export type DemoState = {
  products: Record<string, ProductPatch>;
  orders: Record<string, FulfillmentState>;
};

export const EMPTY_STATE: DemoState = { products: {}, orders: {} };

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const IMAGE_SRC = /^(\/lamps\/[a-z0-9/._-]+|data:image\/(webp|png);base64,[A-Za-z0-9+/=]+)$/;
const FULFILLMENT: FulfillmentState[] = ["unfulfilled", "shipped", "delivered"];

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const str = (value: unknown, max: number) => (typeof value === "string" && value.length > 0 && value.length <= max ? value : undefined);
const int = (value: unknown, min: number, max: number) => (typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : undefined);

/** Keeps only well-formed values from whatever is in storage, so edited or old data can never break a page. */
function cleanPatch(raw: unknown): ProductPatch {
  if (!isRecord(raw)) return {};
  const patch: ProductPatch = {};
  const set = <K extends EditableField>(key: K, value: ProductPatch[K] | undefined) => {
    if (value !== undefined) patch[key] = value;
  };
  set("name", str(raw.name, 60));
  set("finish", str(raw.finish, 40));
  if (typeof raw.collection === "string" && SLUG.test(raw.collection)) patch.collection = raw.collection;
  set("summary", str(raw.summary, 200));
  set("description", str(raw.description, 2000));
  set("priceCents", int(raw.priceCents, 1, 99_999_999));
  set("stock", int(raw.stock, 0, 100_000));
  if (Array.isArray(raw.highlights) && raw.highlights.length <= 6 && raw.highlights.every((item) => typeof item === "string" && item.length > 0 && item.length <= 40)) {
    patch.highlights = raw.highlights as string[];
  }
  if (typeof raw.drop === "number" && raw.drop >= 0.3 && raw.drop <= 1.2) patch.drop = raw.drop;
  if (typeof raw.published === "boolean") patch.published = raw.published;
  const images = raw.images;
  if (isRecord(images)) {
    const { off, on, alt, width, height } = images;
    if (
      typeof off === "string" && IMAGE_SRC.test(off) &&
      typeof on === "string" && IMAGE_SRC.test(on) &&
      typeof alt === "string" && alt.length > 0 && alt.length <= 200 &&
      typeof width === "number" && width > 0 && width <= 4000 &&
      typeof height === "number" && height > 0 && height <= 4000
    ) {
      patch.images = { off, on, alt, width, height };
    }
  }
  return patch;
}

export function parseDemoState(raw: string | null): DemoState {
  if (!raw) return EMPTY_STATE;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY_STATE;
  }
  if (!isRecord(data)) return EMPTY_STATE;
  const products: DemoState["products"] = {};
  if (isRecord(data.products)) {
    for (const [id, patch] of Object.entries(data.products)) {
      if (!SLUG.test(id)) continue;
      const clean = cleanPatch(patch);
      if (Object.keys(clean).length) products[id] = clean;
    }
  }
  const orders: DemoState["orders"] = {};
  if (isRecord(data.orders)) {
    for (const [id, status] of Object.entries(data.orders)) {
      if (SLUG.test(id) && FULFILLMENT.includes(status as FulfillmentState)) orders[id] = status as FulfillmentState;
    }
  }
  return Object.keys(products).length || Object.keys(orders).length ? { products, orders } : EMPTY_STATE;
}

let state: DemoState = EMPTY_STATE;
let loaded = false;
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    state = parseDemoState(window.localStorage.getItem(DEMO_STORAGE_KEY));
  } catch {
    state = EMPTY_STATE;
  }
}

/** Returns an error message when the browser refused the write (storage full or blocked); the change then stays out of the demo. */
function commit(next: DemoState): string | null {
  try {
    if (Object.keys(next.products).length || Object.keys(next.orders).length) window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    return "Your browser couldn’t store this change (storage is full or blocked). Try smaller photos, or use Reset Demo.";
  }
  state = Object.keys(next.products).length || Object.keys(next.orders).length ? next : EMPTY_STATE;
  emit();
  return null;
}

/* Another tab changed or reset the demo: adopt its value. */
function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== DEMO_STORAGE_KEY) return;
  state = parseDemoState(event.newValue);
  emit();
}

export const demoStore = {
  subscribe(listener: () => void) {
    if (listeners.size === 0) window.addEventListener("storage", onStorage);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot(): DemoState {
    load();
    return state;
  },
  getServerSnapshot(): DemoState {
    return EMPTY_STATE;
  },
  /** Merges changes into one product's patch. */
  patchProduct(id: string, patch: ProductPatch): string | null {
    load();
    return commit({ ...state, products: { ...state.products, [id]: { ...state.products[id], ...patch } } });
  },
  setOrderStatus(id: string, status: FulfillmentState): string | null {
    load();
    return commit({ ...state, orders: { ...state.orders, [id]: status } });
  },
  /** Reset Demo: forget every edit. The cart is the visitor's own and stays. */
  reset() {
    load();
    commit(EMPTY_STATE);
  },
};

/** The catalog with the visitor's edits applied, hidden products included (the dashboard lists them all). */
export function applyEdits<T extends { id: string }>(list: T[], edits: DemoState): T[] {
  return list.map((item) => {
    const patch = edits.products[item.id];
    if (!patch) return item;
    const merged: Record<string, unknown> = { ...item };
    // Only fields the item already has: a cart snapshot gets its price, stock and photos, but no description it never carried.
    for (const [key, value] of Object.entries(patch)) if (key in item || key === "published") merged[key] = value;
    return merged as T;
  });
}
