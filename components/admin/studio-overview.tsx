"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ArrowUpRight, EyeOff, PackageOpen, Plus, Truck } from "lucide-react";
import { cn } from "cn";
import { LampImage } from "@/components/product/lamp-image";
import { LightControls, LightStage, useLight } from "@/components/product/light-stage";
import { ProductLink } from "@/components/product/product-link";
import { Button } from "@/components/ui/button";
import { chargedCents, type OrderSummary } from "@/lib/admin/order-format";
import { getStockStatus, productTitle } from "@/lib/catalog/helpers";
import type { AdminProduct, Collection } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { PaymentBadge } from "./order-badges";

/* Fixed time zone, so the server render and the browser agree on every date. */
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

type OverviewProps = {
  base: "/admin" | "/demo/admin";
  products: AdminProduct[];
  collections: Collection[];
  /** Recent orders, newest first; null when they couldn't be loaded (the reason goes in `ordersProblem`). */
  orders: OrderSummary[] | null;
  ordersProblem?: string;
  /** The public demo: its orders are invented, and the page says so wherever they appear. */
  demo?: boolean;
};

/*
 * The admin's landing page: what the catalog looks like right now, what needs doing, and the latest changes and orders. Every number
 * is counted from the products and orders the page was given; nothing is estimated or invented. The featured stage is the storefront's
 * own lighting stage, so the owner can light any pendant exactly as visitors see it.
 */
export function StudioOverview({ base, products, collections, orders, ordersProblem, demo = false }: OverviewProps) {
  const published = products.filter((product) => product.published);
  const usedCollections = new Set(products.map((product) => product.collection));
  const low = published.filter((product) => product.stock <= 5);
  const hidden = products.filter((product) => !product.published);
  const toShip = orders?.filter((order) => order.payment_status === "paid" && order.fulfillment_status === "unfulfilled") ?? [];
  const review = orders?.filter((order) => order.payment_status === "needs_review") ?? [];
  const recent = [...products].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.sortOrder - b.sortOrder).slice(0, 5);
  const editHref = (product: AdminProduct) => `${base}/products/${product.id}`;

  const attention = [
    ...review.map((order) => ({ key: `review-${order.id}`, icon: AlertTriangle, tone: "alert" as const, text: `${order.number} needs review`, detail: "Payment reported a problem", href: `${base}/orders/${order.id}` })),
    ...toShip.map((order) => ({ key: `ship-${order.id}`, icon: Truck, tone: "brass" as const, text: `${order.number} is ready to ship`, detail: `${order.item_count} ${order.item_count === 1 ? "pendant" : "pendants"} · ${order.customer_name ?? "Customer"}`, href: `${base}/orders/${order.id}` })),
    ...low.map((product) => ({ key: `stock-${product.id}`, icon: PackageOpen, tone: product.stock === 0 ? ("alert" as const) : ("brass" as const), text: productTitle(product), detail: getStockStatus(product).label, href: editHref(product) })),
    ...hidden.map((product) => ({ key: `hidden-${product.id}`, icon: EyeOff, tone: "muted" as const, text: productTitle(product), detail: "Hidden from the store", href: editHref(product) })),
  ];

  return (
    <div className="pt-8 sm:pt-12">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow flex items-center gap-3">
            Overview
            {demo && <span className="rounded-full border border-brass/50 bg-brass/10 px-2 py-0.5 text-[10px] tracking-[0.18em] text-brass-deep">Demo data</span>}
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.4rem,4.4vw,3.6rem)] font-light leading-[0.98] tracking-[-0.03em]">
            {published.length} of {products.length} pendants <em className="italic text-brass-deep">lit</em> in the store.
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              View store <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild>
            <Link href={`${base}/products/new`}>
              <Plus aria-hidden="true" /> Add product
            </Link>
          </Button>
        </div>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <FeaturedStage products={products} base={base} />

        <div className="grid content-start gap-6">
          <section aria-labelledby="catalog-title" className="rounded-2xl border border-border bg-card p-6">
            <h2 id="catalog-title" className="eyebrow">
              Catalog
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border">
              <Stat label="Products" value={products.length} detail={`${hidden.length} hidden`} />
              <Stat label="Published" value={published.length} detail={products.length ? `${Math.round((published.length / products.length) * 100)}% of the catalog` : "None yet"} />
              <Stat label="Collections" value={collections.length} detail={`${collections.filter((item) => usedCollections.has(item.id)).length} with products`} />
              <Stat label="Low stock" value={low.length} detail={low.length ? `${low.filter((product) => product.stock === 0).length} sold out` : "All well stocked"} tone={low.length ? "brass" : undefined} />
            </dl>
          </section>

          <section aria-labelledby="attention-title" className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="attention-title" className="eyebrow">
                Needs attention
              </h2>
              <span className="font-mono text-[12px] text-muted-foreground">{attention.length}</span>
            </div>
            {attention.length ? (
              <ul className="mt-3 divide-y divide-border">
                {attention.slice(0, 6).map(({ key, icon: Icon, tone, text, detail, href }) => (
                  <li key={key}>
                    <Link href={href} className="group flex items-center gap-3 rounded-md py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-full",
                          tone === "alert" ? "bg-destructive/10 text-destructive" : tone === "brass" ? "bg-brass/15 text-brass-deep" : "bg-secondary text-muted-foreground",
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium">{text}</span>
                        <span className="block truncate text-[12.5px] text-muted-foreground">{detail}</span>
                      </span>
                      <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Nothing waiting: every pendant is published and stocked{orders ? ", and no order is waiting to ship" : ""}.</p>
            )}
            {attention.length > 6 && <p className="mt-2 text-[12.5px] text-muted-foreground">And {attention.length - 6} more.</p>}
          </section>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="recent-title" className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="recent-title" className="eyebrow">
              Latest product changes
            </h2>
            <Link href={`${base}/products`} className="rounded-sm text-[13px] font-medium underline decoration-foreground/25 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring">
              All products
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {recent.map((product) => (
              <li key={product.id}>
                <Link href={editHref(product)} className="group flex items-center gap-4 rounded-md py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="relative block h-14 w-11 shrink-0 overflow-hidden rounded-md bg-secondary">
                    <LampImage product={product} lit="hover" fit="cover" className="inset-0" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[1.05rem] leading-tight">{productTitle(product)}</span>
                    <span className="block text-[12.5px] text-muted-foreground">
                      {product.updatedAt === product.createdAt ? "Added" : "Edited"} {dateFormat.format(new Date(product.updatedAt))}
                    </span>
                  </span>
                  <span className={cn("text-[12px] font-medium", product.published ? "text-foreground" : "text-muted-foreground")}>{product.published ? "Visible" : "Hidden"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="orders-title" className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="orders-title" className="eyebrow">
              {demo ? "Orders · fictional" : "Latest orders"}
            </h2>
            <Link href={`${base}/orders`} className="rounded-sm text-[13px] font-medium underline decoration-foreground/25 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring">
              All orders
            </Link>
          </div>
          {orders === null ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{ordersProblem ?? "Orders couldn’t be loaded just now."}</p>
          ) : orders.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">No orders yet. They appear here once checkout is connected and a customer pays (docs/CHECKOUT.md).</p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <p className="rounded-lg bg-secondary/70 px-4 py-3">
                  <span className="block font-display text-2xl leading-none tabular-nums">{toShip.length}</span>
                  <span className="mt-1 block text-[12.5px] text-muted-foreground">to ship</span>
                </p>
                <p className={cn("rounded-lg px-4 py-3", review.length ? "bg-destructive/8" : "bg-secondary/70")}>
                  <span className="block font-display text-2xl leading-none tabular-nums">{review.length}</span>
                  <span className="mt-1 block text-[12.5px] text-muted-foreground">need review</span>
                </p>
              </div>
              <ul className="mt-3 divide-y divide-border">
                {orders.slice(0, 4).map((order) => (
                  <li key={order.id}>
                    <Link href={`${base}/orders/${order.id}`} className="flex items-center gap-3 rounded-md py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-[13px]">{order.number}</span>
                        <span className="block truncate text-[12.5px] text-muted-foreground">
                          {order.customer_name ?? "Customer"} · {dateFormat.format(new Date(order.created_at))}
                        </span>
                      </span>
                      <PaymentBadge status={order.payment_status} className="hidden text-[12.5px] sm:inline-flex" />
                      <span className="w-20 text-right text-sm tabular-nums">{formatPrice(chargedCents(order), order.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {demo && <p className="mt-3 text-[12px] text-muted-foreground">Invented for this demo: no real customers, payments or addresses.</p>}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, detail, tone }: { label: string; value: number; detail: string; tone?: "brass" }) {
  return (
    <div className="bg-card px-4 py-4">
      <dt className="text-[12.5px] text-muted-foreground">{label}</dt>
      <dd className="mt-1">
        <span className={cn("block font-display text-[2.2rem] font-light leading-none tabular-nums tracking-[-0.02em]", tone === "brass" && "text-brass-deep")}>{value}</span>
        <span className="mt-1.5 block text-[12px] text-muted-foreground">{detail}</span>
      </dd>
    </div>
  );
}

/* Any pendant on the storefront's lighting stage, after dark, with its switch and dimmer: the catalog seen as visitors see it. */
function FeaturedStage({ products, base }: { products: AdminProduct[]; base: string }) {
  const ordered = React.useMemo(() => [...products.filter((product) => product.published), ...products.filter((product) => !product.published)], [products]);
  const [id, setId] = React.useState(() => ordered[0]?.id ?? null);
  const { level, setLevel, toggle } = useLight(0.85);
  const product = ordered.find((item) => item.id === id) ?? ordered[0];
  if (!product) {
    return (
      <section className="grid place-items-center rounded-2xl bg-night p-10 text-center text-night-muted">
        <p>
          No products yet.{" "}
          <Link href={`${base}/products/new`} className="text-night-foreground underline underline-offset-4">
            Add the first pendant
          </Link>
          .
        </p>
      </section>
    );
  }
  const stock = getStockStatus(product);
  return (
    <section aria-labelledby="stage-title" className="self-start overflow-hidden rounded-2xl bg-night text-night-foreground ring-1 ring-night-line">
      <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <LightStage images={product.images} level={level} room="evening" />
        <div className="flex flex-col p-6">
          <p className="eyebrow text-night-muted!">On the stage</p>
          <h2 id="stage-title" className="mt-3 font-display text-[1.9rem] font-light leading-[1.02] tracking-[-0.02em]">
            {product.name} <span className="block italic text-night-muted">{product.finish}</span>
          </h2>
          <p className="mt-3 text-[13px] leading-relaxed text-night-muted">{product.summary}</p>
          <dl className="mt-5 grid grid-cols-2 gap-y-2 border-t border-night-line pt-4 text-[13px]">
            <dt className="text-night-muted">Price</dt>
            <dd className="text-right font-mono tabular-nums">{formatPrice(product.priceCents, product.currency)}</dd>
            <dt className="text-night-muted">Stock</dt>
            <dd className={cn("text-right", stock.tone !== "in" && "text-ember")}>{stock.tone === "in" ? `${product.stock} in stock` : stock.label}</dd>
            <dt className="text-night-muted">Store</dt>
            <dd className="text-right">{product.published ? "Visible" : "Hidden"}</dd>
          </dl>
          <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-6 text-[13px] font-medium">
            <Link href={`${base}/products/${product.id}`} className="rounded-sm underline decoration-night-muted/50 underline-offset-4 outline-none hover:decoration-night-foreground focus-visible:ring-2 focus-visible:ring-ember">
              Edit pendant
            </Link>
            {product.published && (
              <ProductLink product={product} target="_blank" className="inline-flex items-center gap-1 rounded-sm text-night-muted outline-none hover:text-night-foreground focus-visible:ring-2 focus-visible:ring-ember">
                View in store <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </ProductLink>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-night-line px-6 py-4">
        <LightControls level={level} onLevel={setLevel} onToggle={toggle} label={productTitle(product)} surface="night" />
        <div role="group" aria-label="Choose a pendant for the stage" className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {ordered.map((item) => {
            const active = item.id === product.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                aria-label={productTitle(item)}
                onClick={() => setId(item.id)}
                className={cn(
                  "group relative h-14 w-11 shrink-0 overflow-hidden rounded-md border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ember motion-reduce:transition-none",
                  active ? "border-ember/70 bg-night-raised" : "border-night-line hover:border-night-muted/60",
                  !item.published && "opacity-60",
                )}
              >
                <LampImage product={item} lit={active ? true : "hover"} fit="cover" className="inset-0" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
