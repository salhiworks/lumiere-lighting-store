import "server-only";
import type { OrderLine, OrderRow, OrderSummary, PaymentEvent } from "./order-format";
import type { AdminSession } from "./auth";

/* Orders as the admin reads them: through the administrator's own session, so Row Level Security decides. */

export async function listAdminOrders({ supabase }: AdminSession, limit = 200): Promise<OrderSummary[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, number, created_at, customer_name, customer_email, currency, total_cents, tax_cents, amount_paid_cents, payment_status, fulfillment_status, order_items(quantity)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load orders: ${error.message}`);
  return (data ?? []).map(({ order_items, ...order }) => ({
    ...(order as Omit<OrderSummary, "item_count">),
    item_count: ((order_items ?? []) as { quantity: number }[]).reduce((sum, line) => sum + line.quantity, 0),
  }));
}

export async function getAdminOrder({ supabase }: AdminSession, id: string): Promise<{ order: OrderRow; lines: OrderLine[]; events: PaymentEvent[] } | null> {
  const [order, lines, events] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id).order("id"),
    supabase.from("payment_events").select("*").eq("order_id", id).order("received_at"),
  ]);
  const error = order.error ?? lines.error ?? events.error;
  if (error) throw new Error(`Could not load the order: ${error.message}`);
  if (!order.data) return null;
  return { order: order.data as OrderRow, lines: (lines.data ?? []) as OrderLine[], events: (events.data ?? []) as PaymentEvent[] };
}
