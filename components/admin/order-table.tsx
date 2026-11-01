"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "cn";
import { chargedCents, type OrderSummary } from "@/lib/admin/order-format";
import { formatPrice } from "@/lib/format";
import { controlClass } from "./form-controls";
import { FulfillmentBadge, PaymentBadge } from "./order-badges";

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "to-ship", label: "To ship", test: (order: OrderSummary) => order.payment_status === "paid" && order.fulfillment_status === "unfulfilled" },
  { id: "awaiting", label: "Awaiting payment", test: (order: OrderSummary) => order.payment_status === "pending" || order.payment_status === "processing" },
  { id: "review", label: "Needs review", test: (order: OrderSummary) => order.payment_status === "needs_review" },
  { id: "sent", label: "Shipped", test: (order: OrderSummary) => order.payment_status === "paid" && order.fulfillment_status !== "unfulfilled" },
  { id: "closed", label: "Not completed", test: (order: OrderSummary) => ["failed", "expired", "canceled"].includes(order.payment_status) },
] as const;

/* Fixed time zone, so the server render and the browser agree on every date. */
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

export function OrderTable({ orders }: { orders: OrderSummary[] }) {
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = React.useState("");
  const needle = query.trim().toLowerCase();
  const active = FILTERS.find((item) => item.id === filter) ?? FILTERS[0];
  const visible = orders.filter(
    (order) => active.test(order) && (!needle || [order.number, order.customer_name ?? "", order.customer_email ?? ""].some((value) => value.toLowerCase().includes(needle))),
  );

  if (!orders.length) {
    return (
      <div className="mt-10 rounded-lg border border-dashed border-foreground/20 px-8 py-16 text-center">
        <p className="font-display text-2xl">No orders yet</p>
        <p className="mx-auto mt-2 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
          Orders appear here the moment a customer starts checkout, and their payment status follows Stripe from then on.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-4">
        <div role="group" aria-label="Show orders" className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => {
            const count = orders.filter(item.test).length;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
                className={cn(
                  "h-8 rounded-full border px-3.5 text-[12.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                  filter === item.id ? "border-foreground bg-foreground text-background" : "border-foreground/20 hover:border-foreground/45",
                )}
              >
                {item.label} <span className="tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <label htmlFor="order-search" className="sr-only">
            Search orders
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id="order-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Order number, name or email"
            className={cn(controlClass, "h-10 pl-10")}
          />
        </div>
      </div>
      <p aria-live="polite" className="mt-3 text-[13px] text-muted-foreground">
        {visible.length === orders.length ? `${orders.length} orders.` : `${visible.length} of ${orders.length} orders.`}
      </p>

      {visible.length === 0 ? (
        <p className="mt-6 border-t border-foreground/15 py-10 text-center text-sm text-muted-foreground">No orders match. Try another filter or search.</p>
      ) : (
        <ul className="mt-4 border-t border-foreground/15">
          {visible.map((order) => (
            <li key={order.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 border-b border-border py-4 md:grid-cols-[7rem_minmax(0,1.6fr)_8rem_10rem_6rem_6.5rem]">
              <Link
                href={`/admin/orders/${order.id}`}
                aria-label={`Order ${order.number}`}
                className="font-mono text-[13.5px] font-medium underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                {order.number}
              </Link>
              <div className="min-w-0 max-md:order-3 max-md:col-span-2">
                <p className="truncate text-sm">{order.customer_name ?? <span className="text-muted-foreground">Not entered yet</span>}</p>
                <p className="truncate text-[12.5px] text-muted-foreground">{order.customer_email ?? `${order.item_count} ${order.item_count === 1 ? "pendant" : "pendants"}`}</p>
              </div>
              <p className="text-[13px] text-muted-foreground max-md:hidden">{dateFormat.format(new Date(order.created_at))} UTC</p>
              <PaymentBadge status={order.payment_status} className="max-md:order-4" />
              <div className="max-md:order-5">
                <FulfillmentBadge status={order.fulfillment_status} payment={order.payment_status} />
              </div>
              <p className="text-right font-display text-lg tabular-nums md:text-base">{formatPrice(chargedCents(order), order.currency)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
