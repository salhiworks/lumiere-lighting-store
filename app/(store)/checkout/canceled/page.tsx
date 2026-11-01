import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderStatusView } from "@/components/checkout/order-status-view";
import { orderStatusForCustomer } from "@/lib/checkout/orders";

/*
 * Stripe sends the customer here when they leave the payment page. The server ends that payment page (if it is still open and
 * unpaid), so the reserved pendants go straight back on sale; if it was paid after all, the page says so.
 */
export const instant = false;

export const metadata: Metadata = { title: "Checkout ended", robots: { index: false, follow: false } };

export default async function CheckoutCanceledPage({ searchParams }: PageProps<"/checkout/canceled">) {
  const { order } = await searchParams;
  const status = typeof order === "string" ? await orderStatusForCustomer(order, "canceled") : null;
  if (!status) notFound();
  return <OrderStatusView order={status} />;
}
