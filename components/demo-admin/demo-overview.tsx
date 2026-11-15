"use client";

import { StudioOverview } from "@/components/admin/studio-overview";
import { demoAdminCollections, demoAdminProducts } from "@/lib/demo-admin/catalog";
import { demoOrders, toSummary } from "@/lib/demo-admin/orders";
import { useDemoEdits } from "@/lib/demo-admin/use-demo-catalog";

/* The demo's Overview: the real admin's Overview over the sample catalog, this browser's edits and the invented orders (labelled as such). */
export function DemoOverview() {
  const edits = useDemoEdits();
  const orders = demoOrders.map((order) => toSummary(order, edits.orders[order.id] ?? order.fulfillment)).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return <StudioOverview base="/demo/admin" products={demoAdminProducts(edits)} collections={demoAdminCollections} orders={orders} demo />;
}
