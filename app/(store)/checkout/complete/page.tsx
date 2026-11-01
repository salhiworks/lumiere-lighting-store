import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderStatusView } from "@/components/checkout/order-status-view";
import { orderStatusForCustomer } from "@/lib/checkout/orders";

/* Stripe sends the customer here after paying. The page shows what Stripe has confirmed, never "paid" just because it was visited. */
export const instant = false;

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

export default async function CheckoutCompletePage({ searchParams }: PageProps<"/checkout/complete">) {
  const { order } = await searchParams;
  const status = typeof order === "string" ? await orderStatusForCustomer(order, "complete") : null;
  if (!status) notFound();
  return <OrderStatusView order={status} />;
}
