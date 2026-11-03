"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormSection } from "@/components/admin/form-controls";
import { PaymentBadge, FulfillmentBadge } from "@/components/admin/order-badges";
import { OrderTable } from "@/components/admin/order-table";
import { Button } from "@/components/ui/button";
import { demoAdminProducts } from "@/lib/demo-admin/catalog";
import { demoOrders, linesTotal, toSummary } from "@/lib/demo-admin/orders";
import { demoStore, type FulfillmentState } from "@/lib/demo-admin/store";
import { useDemoEdits } from "@/lib/demo-admin/use-demo-catalog";
import { formatPrice } from "@/lib/format";
import { DemoBanner } from "./demo-banner";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

/* Orders: the real admin's order table over six invented orders. */
export function DemoOrders() {
  const edits = useDemoEdits();
  const orders = demoOrders.map((order) => toSummary(order, edits.orders[order.id] ?? order.fulfillment));
  const toShip = orders.filter((order) => order.payment_status === "paid" && order.fulfillment_status === "unfulfilled").length;
  return (
    <>
      <div className="pt-10">
        <p className="eyebrow">Sales</p>
        <h1 className="mt-2 font-display text-[clamp(2.2rem,4vw,3rem)] font-light leading-none tracking-[-0.02em]">Orders</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {orders.length} fictional orders · {toShip} to ship
        </p>
      </div>
      <DemoBanner />
      <OrderTable orders={orders} orderHref={(order) => `/demo/admin/orders/${order.id}`} />
    </>
  );
}

export function DemoOrderDetail({ id }: { id: string }) {
  const edits = useDemoEdits();
  const order = demoOrders.find((item) => item.id === id);
  if (!order) return <p className="py-24 text-center text-sm text-muted-foreground">No sample order has this ID.</p>;
  const names = new Map(demoAdminProducts(edits).map((product) => [product.id, `${product.name} · ${product.finish}`]));
  const fulfillment = edits.orders[order.id] ?? order.fulfillment;
  const paid = order.payment === "paid";
  const total = linesTotal(order) + order.shippingCents;
  const set = (status: FulfillmentState) => demoStore.setOrderStatus(order.id, status);

  return (
    <>
      <Link href="/demo/admin/orders" className="mt-8 inline-flex items-center gap-1.5 rounded-sm text-[13px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
        <ArrowLeft className="size-3.5" aria-hidden="true" /> All orders
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Fictional order · {dateFormat.format(new Date(order.createdAt))} UTC</p>
          <h1 className="mt-2 font-mono text-[clamp(1.8rem,3.4vw,2.4rem)] font-medium leading-none tracking-tight">{order.number}</h1>
        </div>
        <PaymentBadge status={order.payment} className="text-sm" />
      </div>
      <DemoBanner />
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-14">
        <FormSection title="Pendants" description="As ordered: prices are frozen on the order and don’t follow later product edits.">
          <ul className="border-t border-foreground/15">
            {order.lines.map((line) => (
              <li key={line.productId} className="flex items-baseline justify-between gap-4 border-b border-border py-3.5">
                <span>
                  <span className="font-display text-lg">{names.get(line.productId) ?? line.productId}</span>
                  <span className="ml-3 text-[13px] text-muted-foreground">
                    {line.quantity} × {formatPrice(line.unitCents)}
                  </span>
                </span>
                <span className="tabular-nums">{formatPrice(line.unitCents * line.quantity)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-4 py-3 text-sm text-muted-foreground">
              <span>Shipping</span>
              <span className="tabular-nums">{formatPrice(order.shippingCents)}</span>
            </li>
            <li className="flex justify-between gap-4 border-t border-foreground/15 py-3 font-display text-xl">
              <span>Total</span>
              <span className="tabular-nums">{formatPrice(total)}</span>
            </li>
          </ul>
        </FormSection>
        <div className="grid content-start gap-10">
          <FormSection title="Customer" description="Invented for this demo.">
            <p className="text-sm leading-relaxed">
              {order.customerName}
              <br />
              {order.customerEmail}
              <br />
              {order.city}
            </p>
          </FormSection>
          <FormSection title="Fulfillment" description={paid ? "Moves the sample order along. Reset Demo puts it back." : "Fulfillment opens once the payment is confirmed."}>
            <p className="text-sm">
              Now: <FulfillmentBadge status={fulfillment} payment={order.payment} />
              {!paid && <span className="text-muted-foreground"> not paid, so nothing to ship</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" disabled={!paid || fulfillment === "unfulfilled"} onClick={() => set("unfulfilled")}>
                Not shipped
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={!paid || fulfillment === "shipped"} onClick={() => set("shipped")}>
                Mark shipped
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={!paid || fulfillment === "delivered"} onClick={() => set("delivered")}>
                Mark delivered
              </Button>
            </div>
          </FormSection>
        </div>
      </div>
    </>
  );
}
