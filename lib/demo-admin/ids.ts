/*
 * Products created in the public Demo Admin Dashboard live only in the visitor's browser, so the server has never heard of them.
 * Their IDs carry a fixed prefix, which lets the storefront tell them apart without reading storage: their pages are drawn in the
 * browser (see components/demo-admin/demo-not-found.tsx), and links to them are plain page loads rather than server prefetches.
 */
export const LOCAL_ID = /^local-[a-z0-9]{6,12}$/;

export function isLocalProductId(id: string): boolean {
  return LOCAL_ID.test(id);
}

export function newLocalProductId(): string {
  const random = Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) => (byte % 36).toString(36)).join("");
  return `local-${random}`;
}

/*
 * The slugs of the visitor's published demo products, mirrored from localStorage into one first-party cookie, so the public demo's
 * proxy can answer their addresses with a real page (HTTP 200) instead of a 404. Only slugs travel: the products themselves stay in
 * the browser. Read only in the public demo build (proxy.ts); a normal build never looks at it.
 */
export const LOCAL_SLUGS_COOKIE = "lumiere-demo-local";
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const MAX_LOCAL_SLUGS = 12;

export function parseLocalSlugs(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(".")
    .filter((slug) => slug.length <= 80 && SLUG.test(slug))
    .slice(0, MAX_LOCAL_SLUGS);
}
