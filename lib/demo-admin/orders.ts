import type { OrderSummary, PaymentStatus } from "@/lib/admin/order-format";
import type { FulfillmentState } from "./store";

/*
 * Fictional orders for the Demo Admin Dashboard. They are invented: the names are placeholders, the addresses use the reserved
 * example.com domain, and nothing here was ever a customer, a payment or a Stripe event. The public demo has no checkout.
 * Prices are what the pendants cost on the day of each order, so editing a product's price doesn't rewrite order history.
 */

export type DemoOrderLine = { productId: string; quantity: number; unitCents: number };

export type DemoOrder = {
  id: string;
  number: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  city: string;
  payment: PaymentStatus;
  /** Starting shipping state; the dashboard can move it forward and Reset Demo puts it back. */
  fulfillment: FulfillmentState;
  shippingCents: number;
  lines: DemoOrderLine[];
};

export const demoOrders: DemoOrder[] = [
  {
    id: "demo-1008",
    number: "LUM-1008",
    createdAt: "2026-11-02T16:42:00Z",
    customerName: "Avery Placeholder",
    customerEmail: "avery@example.com",
    city: "Portland, OR",
    payment: "paid",
    fulfillment: "unfulfilled",
    shippingCents: 1500,
    lines: [
      { productId: "dome-enamel", quantity: 2, unitCents: 18000 },
      { productId: "glass-globe", quantity: 1, unitCents: 21000 },
    ],
  },
  {
    id: "demo-1007",
    number: "LUM-1007",
    createdAt: "2026-11-02T09:15:00Z",
    customerName: "Jordan Sample",
    customerEmail: "jordan@example.com",
    city: "Austin, TX",
    payment: "paid",
    fulfillment: "unfulfilled",
    shippingCents: 1500,
    lines: [{ productId: "copper-bell", quantity: 1, unitCents: 39000 }],
  },
  {
    id: "demo-1006",
    number: "LUM-1006",
    createdAt: "2026-11-01T20:03:00Z",
    customerName: "Sam Fictional",
    customerEmail: "sam@example.com",
    city: "Chicago, IL",
    payment: "pending",
    fulfillment: "unfulfilled",
    shippingCents: 1500,
    lines: [{ productId: "paper-lantern", quantity: 3, unitCents: 12000 }],
  },
  {
    id: "demo-1005",
    number: "LUM-1005",
    createdAt: "2026-10-30T13:30:00Z",
    customerName: "Riley Example",
    customerEmail: "riley@example.com",
    city: "Denver, CO",
    payment: "paid",
    fulfillment: "shipped",
    shippingCents: 1500,
    lines: [
      { productId: "cone-brass", quantity: 1, unitCents: 24000 },
      { productId: "rattan-weave", quantity: 1, unitCents: 15000 },
    ],
  },
  {
    id: "demo-1004",
    number: "LUM-1004",
    createdAt: "2026-10-28T11:22:00Z",
    customerName: "Casey Demo",
    customerEmail: "casey@example.com",
    city: "Seattle, WA",
    payment: "paid",
    fulfillment: "delivered",
    shippingCents: 1500,
    lines: [{ productId: "concrete-cone", quantity: 2, unitCents: 26000 }],
  },
  {
    id: "demo-1003",
    number: "LUM-1003",
    createdAt: "2026-10-26T08:47:00Z",
    customerName: "Morgan Test",
    customerEmail: "morgan@example.com",
    city: "Boston, MA",
    payment: "expired",
    fulfillment: "unfulfilled",
    shippingCents: 1500,
    lines: [{ productId: "fluted-glass", quantity: 1, unitCents: 19000 }],
  },
];

export const linesTotal = (order: DemoOrder) => order.lines.reduce((sum, line) => sum + line.unitCents * line.quantity, 0);

export function toSummary(order: DemoOrder, fulfillment: FulfillmentState): OrderSummary {
  const total = linesTotal(order) + order.shippingCents;
  return {
    id: order.id,
    number: order.number,
    created_at: order.createdAt,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    currency: "USD",
    total_cents: total,
    tax_cents: null,
    amount_paid_cents: order.payment === "paid" ? total : null,
    payment_status: order.payment,
    fulfillment_status: fulfillment,
    item_count: order.lines.reduce((sum, line) => sum + line.quantity, 0),
  };
}
