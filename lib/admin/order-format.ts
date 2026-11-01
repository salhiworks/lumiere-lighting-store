import type { Database } from "@/lib/supabase/database.types";

/* Order types, labels and totals shared by the admin's server pages and its browser components. */

export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderLine = Database["public"]["Tables"]["order_items"]["Row"];
export type PaymentEvent = Database["public"]["Tables"]["payment_events"]["Row"];
export type PaymentStatus = OrderRow["payment_status"];
export type FulfillmentStatus = OrderRow["fulfillment_status"];

export type OrderSummary = Pick<
  OrderRow,
  "id" | "number" | "created_at" | "customer_name" | "customer_email" | "currency" | "total_cents" | "tax_cents" | "amount_paid_cents" | "payment_status" | "fulfillment_status"
> & { item_count: number };

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Awaiting payment",
  processing: "Payment processing",
  paid: "Paid",
  failed: "Payment failed",
  expired: "Checkout expired",
  canceled: "Checkout canceled",
  needs_review: "Needs review",
};

export const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = { unfulfilled: "Not shipped", shipped: "Shipped", delivered: "Delivered" };

/** What the order came to in the end: the provider's charge once paid, otherwise the order's own total plus any tax. */
export function chargedCents(order: Pick<OrderRow, "amount_paid_cents" | "total_cents" | "tax_cents">) {
  return order.amount_paid_cents ?? order.total_cents + (order.tax_cents ?? 0);
}
