import "server-only";
import { getSupabaseConfig, type SupabaseConfig } from "@/lib/supabase/config";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { demoProducts } from "./demo-data";

/**
 * Where proxy.ts sends unknown product URLs: a path no route matches, so Next.js answers with the store's not-found page and a 404
 * status that is fixed by routing, before anything renders (a page that has started streaming can only send a 200).
 */
export const MISSING_PRODUCT_PATH = "/_missing-pendant";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FRESH_MS = 10_000;
const RECHECK_MS = 2_000;

type Memo = { slugs: Set<string>; at: number };
/*
 * proxy.ts and the admin's Server Actions are bundled separately but run in the same Node.js process, so the memo lives on
 * globalThis: that way an admin save can clear it (forgetPublishedSlugs) and the very next request sees the change.
 */
const shared = globalThis as typeof globalThis & { __lumierePublishedSlugs?: { memo: Memo | null; generation: number } };
const state = (shared.__lumierePublishedSlugs ??= { memo: null, generation: 0 });

/*
 * Whether /shop/<slug> is a published product. proxy.ts asks before the page renders, so unknown and hidden products get a real
 * 404 instead of a page that has already started streaming with a 200. Kept fast: the published slugs are remembered for 10 seconds,
 * and re-read on a miss (at most every 2 seconds), so a newly published product works at once while random URLs can't hammer the
 * database. Admin saves clear the memo, so hiding a product turns its URL into a 404 immediately. Returns null when the answer is
 * unknown (database unreachable): the page then decides.
 */
export async function isPublishedSlug(slug: string): Promise<boolean | null> {
  if (!SLUG.test(slug)) return false;
  let config: SupabaseConfig | null;
  try {
    config = getSupabaseConfig();
  } catch {
    return null;
  }
  if (!config) return demoProducts.some((product) => product.slug === slug && product.published);

  const { memo, generation } = state;
  const age = memo ? Date.now() - memo.at : Infinity;
  if (memo && age < FRESH_MS && (memo.slugs.has(slug) || age < RECHECK_MS)) return memo.slugs.has(slug);
  const { data, error } = await createSupabasePublicClient().from("products").select("slug").eq("is_published", true);
  if (error) return null;
  const slugs = new Set(data.map((row) => row.slug));
  // A lookup that started before an admin save must not bring back the list that save just cleared.
  if (state.generation === generation) state.memo = { slugs, at: Date.now() };
  return slugs.has(slug);
}

/** Called after every admin change to the catalog, alongside updateTag(CATALOG_TAG). */
export function forgetPublishedSlugs() {
  state.memo = null;
  state.generation += 1;
}
