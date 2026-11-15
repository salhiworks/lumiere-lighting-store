"use client";

import * as React from "react";
import { ProductDetail, relatedProducts } from "@/components/product/product-detail";
import { demoCollections, demoProducts } from "@/lib/catalog/demo-data";
import { productTitle } from "@/lib/catalog/helpers";
import { LOCAL_SLUGS_COOKIE, parseLocalSlugs } from "@/lib/demo-admin/ids";
import { useDemoEdits, useDemoProducts } from "@/lib/demo-admin/use-demo-catalog";

const subscribeNever = () => () => {};
const PRODUCT_PATH = /^\/shop\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/;

type DemoNotFoundProps = {
  fallback: React.ReactNode;
  /**
   * "product": the demo's local-product page. The server already knows (from the visitor's address cookie) that this is one of their
   * products, so it shows the product page's skeleton until the browser has read it from localStorage.
   * "fallback": the store's 404 page. It shows the not-found message straight away, and only switches to a product if the visitor's
   * browser holds one at this address (cookies blocked, so the server couldn't tell).
   */
  mode: "product" | "fallback";
};

/*
 * Products the visitor created in the Demo Admin exist only in their browser. This draws one from localStorage at its /shop/<slug>
 * address, with the same components as every other product page; otherwise it shows the store's not-found message.
 */
export function DemoNotFound({ fallback, mode }: DemoNotFoundProps) {
  const ready = React.useSyncExternalStore(subscribeNever, () => true, () => false);
  const edits = useDemoEdits();
  const shown = useDemoProducts(demoProducts);
  const slug = ready ? PRODUCT_PATH.exec(window.location.pathname)?.[1] : undefined;
  const product = slug ? shown.find((item) => item.slug === slug) : undefined;
  const local = product && edits.created[product.id] ? product : undefined;
  // Product mode with no such product here: reload for a real 404 once the cookie no longer names it; if it still does, say not found.
  const reloading = mode === "product" && ready && !local && Boolean(slug) && !cookieSlugs().includes(slug!);

  React.useEffect(() => {
    if (local) document.title = `${productTitle(local)} · LUMIÈRE`;
  }, [local]);

  /*
   * The address cookie named a product this browser no longer has (deleted or reset in another tab, cleared storage, or an edited
   * cookie). Reading the demo store has already rewritten the cookie from localStorage, so one reload lets the server answer with a
   * real 404. If the cookie still names this slug (cookies can't be written), stay put rather than loop.
   */
  React.useEffect(() => {
    if (reloading) window.location.replace(window.location.href);
  }, [reloading]);

  if (!ready || reloading) return mode === "product" ? <ProductSkeleton /> : <>{fallback}</>;
  if (!local) return <>{fallback}</>;
  const collection = demoCollections.find((item) => item.id === local.collection) ?? { id: local.collection, name: "Collection", description: "" };
  return <ProductDetail product={local} collection={collection} related={relatedProducts(local, shown)} />;
}

/*
 * The product page's own layout, unlit: an empty lighting stage with its ceiling rose and cord, a faint warmth where the lamp will
 * hang, and soft bars where the name, price and actions go. Shown for the moment it takes the browser to read the product.
 */
function ProductSkeleton() {
  return (
    <div data-product-skeleton aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading the pendant…</p>
      <div aria-hidden="true">
        <div className="shell pt-6 sm:pt-8">
          <span className="block h-3.5 w-48 animate-pulse rounded bg-secondary" />
        </div>
        <div className="shell grid gap-10 pb-20 pt-6 sm:pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16 xl:gap-24">
          <div className="mx-auto w-full lg:max-w-[min(100%,calc((100svh-13rem)*0.8))]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary/70">
              <span className="room-glow absolute inset-x-[-20%] top-[-6%] h-full animate-pulse opacity-40" />
              <span className="absolute inset-x-0 bottom-0 h-[19%] border-t border-foreground/10 bg-secondary" />
              <span className="ceiling-canopy absolute left-1/2 top-0 z-10 w-10 -translate-x-1/2" />
              <span className="absolute left-1/2 top-0 h-[36%] w-px -translate-x-1/2 bg-foreground/25" />
            </div>
            <div className="mt-5 flex items-center gap-4">
              <span className="h-6 w-11 rounded-full bg-secondary" />
              <span className="h-1 flex-1 rounded-full bg-secondary" />
              <span className="h-8 w-36 rounded-full bg-secondary" />
            </div>
          </div>
          <div className="lg:pt-2">
            <span className="block h-3 w-32 animate-pulse rounded bg-secondary" />
            <span className="mt-5 block h-14 w-3/4 animate-pulse rounded-md bg-secondary" />
            <span className="mt-3 block h-6 w-1/3 animate-pulse rounded bg-secondary" />
            <span className="mt-8 block h-4 w-5/6 animate-pulse rounded bg-secondary" />
            <span className="mt-8 block border-t border-foreground/15 pt-6">
              <span className="block h-9 w-28 animate-pulse rounded bg-secondary" />
            </span>
            <span className="mt-6 flex gap-3">
              <span className="h-12 w-28 rounded-full bg-secondary" />
              <span className="h-12 w-60 animate-pulse rounded-full bg-secondary" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function cookieSlugs() {
  const value = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${LOCAL_SLUGS_COOKIE}=`))
    ?.slice(LOCAL_SLUGS_COOKIE.length + 1);
  return parseLocalSlugs(value);
}
