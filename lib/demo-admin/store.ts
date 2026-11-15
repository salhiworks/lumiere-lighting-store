import { demoCollections, demoProducts } from "@/lib/catalog/demo-data";
import type { Product, ProductSpec } from "@/lib/catalog/types";
import { LOCAL_ID, LOCAL_SLUGS_COOKIE, MAX_LOCAL_SLUGS } from "./ids";

/*
 * The public demo's "database": edits made in the Demo Admin Dashboard, kept in this browser's localStorage and nowhere else.
 * It stores only what a visitor changed (a partial product per ID, order shipping states, and the products the visitor created), so
 * the built-in catalog stays the source of everything else and Reset Demo is just deleting one key. Plain TypeScript, read through useSyncExternalStore like the
 * cart (lib/cart.ts): the server snapshot is always empty, so hydration never mismatches.
 *
 * Nothing here talks to a server. Every caller is gated by PUBLIC_DEMO, so a normal build never reads or writes this key.
 */

export const DEMO_STORAGE_KEY = "lumiere.demo-admin.v1";

/** The product fields a visitor can change in the demo dashboard. Anything else (slug, id, specs…) always comes from the catalog. */
export const EDITABLE_FIELDS = ["name", "finish", "collection", "summary", "description", "priceCents", "stock", "highlights", "drop", "images", "published"] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];
export type ProductPatch = Partial<Pick<Product, EditableField>> & { updatedAt?: string };

/** A product the visitor created in the demo dashboard: a complete product, kept whole in this browser. ID prefix: `local-`. */
export type CreatedProduct = Product & { createdAt: string; updatedAt: string };

/** What a visitor can change on a product they created themselves: everything but the ID and currency. */
export type CreatedPatch = Partial<Omit<Product, "id" | "currency">>;

export type FulfillmentState = "unfulfilled" | "shipped" | "delivered";

export type DemoState = {
  products: Record<string, ProductPatch>;
  orders: Record<string, FulfillmentState>;
  created: Record<string, CreatedProduct>;
};

export const EMPTY_STATE: DemoState = { products: {}, orders: {}, created: {} };

/** At most this many visitor-created products, so the demo stays a demo (photos are the real limit: the browser's storage). */
export const MAX_CREATED = MAX_LOCAL_SLUGS;

const isEmpty = (state: DemoState) => !Object.keys(state.products).length && !Object.keys(state.orders).length && !Object.keys(state.created).length;

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
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
  const images = cleanImages(raw.images);
  if (images) patch.images = images;
  if (typeof raw.updatedAt === "string" && ISO.test(raw.updatedAt)) patch.updatedAt = raw.updatedAt;
  return patch;
}

function cleanImages(images: unknown): Product["images"] | undefined {
  if (!isRecord(images)) return undefined;
  const { off, on, alt, width, height } = images;
  if (
    typeof off === "string" && IMAGE_SRC.test(off) &&
    typeof on === "string" && IMAGE_SRC.test(on) &&
    typeof alt === "string" && alt.length > 0 && alt.length <= 200 &&
    typeof width === "number" && width > 0 && width <= 4000 &&
    typeof height === "number" && height > 0 && height <= 4000
  ) {
    return { off, on, alt, width, height };
  }
  return undefined;
}

const COLLECTION_IDS = new Set(demoCollections.map((collection) => collection.id));
const BUILT_IN_SLUGS = new Set(demoProducts.map((product) => product.slug));

/** A created product is kept only when every field is complete and valid; anything else in storage is dropped whole. */
function cleanCreated(id: string, raw: unknown): CreatedProduct | null {
  if (!LOCAL_ID.test(id) || !isRecord(raw)) return null;
  const patch = cleanPatch(raw);
  const { name, finish, collection, summary, description, priceCents, stock, highlights, drop, images, published } = patch;
  const slug = typeof raw.slug === "string" && raw.slug.length <= 80 && SLUG.test(raw.slug) && !BUILT_IN_SLUGS.has(raw.slug) ? raw.slug : undefined;
  const diameterCm = typeof raw.diameterCm === "number" && raw.diameterCm >= 1 && raw.diameterCm <= 500 ? raw.diameterCm : undefined;
  const specs = cleanSpecs(raw.specs);
  const createdAt = typeof raw.createdAt === "string" && ISO.test(raw.createdAt) ? raw.createdAt : undefined;
  if (
    !name || !finish || !collection || !COLLECTION_IDS.has(collection) || !summary || !description || priceCents === undefined || stock === undefined ||
    !highlights || drop === undefined || !images || published === undefined || !slug || diameterCm === undefined || !specs || !createdAt
  ) {
    return null;
  }
  return { id, slug, name, finish, collection, priceCents, currency: "USD", stock, diameterCm, summary, description, highlights, specs, images, drop, published, createdAt, updatedAt: patch.updatedAt ?? createdAt };
}

function cleanSpecs(raw: unknown): ProductSpec[] | undefined {
  if (!Array.isArray(raw) || raw.length > 12) return undefined;
  const specs: ProductSpec[] = [];
  for (const item of raw) {
    if (!isRecord(item)) return undefined;
    const label = str(item.label, 30);
    const value = str(item.value, 120);
    if (!label || !value) return undefined;
    specs.push({ label, value });
  }
  return specs;
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
  const created: DemoState["created"] = {};
  if (isRecord(data.created)) {
    const slugs = new Set<string>();
    for (const [id, raw] of Object.entries(data.created).slice(0, MAX_CREATED)) {
      const product = cleanCreated(id, raw);
      // Two created products can never share an address.
      if (product && !slugs.has(product.slug)) {
        slugs.add(product.slug);
        created[id] = product;
      }
    }
  }
  const next = { products, orders, created };
  return isEmpty(next) ? EMPTY_STATE : next;
}

/** Whether a URL name is free for a visitor-created product: not a built-in pendant's, nor another created product's. */
export function slugAvailable(state: DemoState, slug: string, exceptId?: string): boolean {
  if (BUILT_IN_SLUGS.has(slug)) return false;
  return !Object.values(state.created).some((product) => product.slug === slug && product.id !== exceptId);
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
  syncSlugCookie(state);
}

/*
 * Tells the public demo's server which product addresses this browser can draw: the slugs of the visitor's published products, in one
 * cookie (see LOCAL_SLUGS_COOKIE). Rewritten after every change and on load, so it always matches localStorage; removed when empty.
 */
function syncSlugCookie(next: DemoState) {
  if (typeof document === "undefined") return;
  const slugs = Object.values(next.created)
    .filter((product) => product.published)
    .map((product) => product.slug);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = slugs.length
    ? `${LOCAL_SLUGS_COOKIE}=${slugs.join(".")}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`
    : `${LOCAL_SLUGS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

/** Returns an error message when the browser refused the write (storage full or blocked); the change then stays out of the demo. */
function commit(next: DemoState): string | null {
  try {
    if (!isEmpty(next)) window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    return "Your browser couldn’t store this change (storage is full or blocked). Try smaller photos or a sample pair, or use Reset Demo.";
  }
  state = isEmpty(next) ? EMPTY_STATE : next;
  syncSlugCookie(state);
  emit();
  return null;
}

/* Another tab changed or reset the demo: adopt its value. */
function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== DEMO_STORAGE_KEY) return;
  state = parseDemoState(event.newValue);
  syncSlugCookie(state);
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
  /** Merges changes into one product: a built-in pendant's patch, or the whole record of a product the visitor created. */
  patchProduct(id: string, patch: ProductPatch | CreatedPatch): string | null {
    load();
    const updatedAt = new Date().toISOString();
    const created = state.created[id];
    if (created) {
      if ("slug" in patch && patch.slug && !slugAvailable(state, patch.slug, id)) return "Another pendant already uses this URL name.";
      const fields: Record<string, unknown> = { ...patch };
      delete fields.updatedAt;
      return commit({ ...state, created: { ...state.created, [id]: { ...created, ...fields, id, currency: "USD", updatedAt } } });
    }
    return commit({ ...state, products: { ...state.products, [id]: { ...state.products[id], ...(patch as ProductPatch), updatedAt } } });
  },
  /** Adds a product the visitor made. The caller has validated it; the URL name must be free. */
  createProduct(product: Omit<CreatedProduct, "createdAt" | "updatedAt">): string | null {
    load();
    if (!LOCAL_ID.test(product.id)) return "This product couldn’t be created.";
    if (Object.keys(state.created).length >= MAX_CREATED) return `The demo keeps up to ${MAX_CREATED} new products. Use Reset Demo to start over.`;
    if (!slugAvailable(state, product.slug)) return "Another pendant already uses this URL name.";
    const now = new Date().toISOString();
    return commit({ ...state, created: { ...state.created, [product.id]: { ...product, createdAt: now, updatedAt: now } } });
  },
  /** Deletes a product the visitor created. Built-in pendants can only be hidden, as in the real admin. */
  deleteProduct(id: string): string | null {
    load();
    if (!state.created[id]) return "Only products you created in this demo can be deleted.";
    const rest = { ...state.created };
    delete rest[id];
    return commit({ ...state, created: rest });
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
