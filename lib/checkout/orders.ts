import "server-only";
import Stripe from "stripe";
import { productTitle } from "@/lib/catalog/helpers";
import { stripeProvider } from "@/lib/payments/stripe";
import type { PaymentProvider, PaymentReport } from "@/lib/payments/types";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getCheckoutAvailability, type CheckoutConfig } from "./config";

/*
 * The ordering flow on the server. Stock and payment state only ever change inside the checkout_* database functions, in one
 * transaction each; this file decides when to call them and talks to the payment provider.
 */

/** A payment page always ends this long after its order was created (Stripe needs at least 30 minutes). */
const SESSION_LIFETIME_MS = 32 * 60 * 1000;

export type CheckoutProblem = { productId: string | null; reason: "invalid_quantity" | "unavailable" | "currency" | "insufficient_stock" | "empty_cart"; available?: number };
export type StartCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; message: string; problems?: CheckoutProblem[]; retryWithNewRequest?: boolean };

type CreatedOrder = {
  id: string;
  number: string;
  public_token: string;
  payment_status: string;
  checkout_url?: string | null;
  checkout_expires_at?: string | null;
  created_at?: string;
  items?: { product_id: string; name: string; finish: string; unit_price_cents: number; quantity: number }[];
};

export function providerFor(config: CheckoutConfig): PaymentProvider {
  return stripeProvider(config);
}

export async function startCheckout(requestId: string, lines: { productId: string; quantity: number }[]): Promise<StartCheckoutResult> {
  const availability = getCheckoutAvailability();
  if (availability.status !== "ready") return { ok: false, message: "Checkout isn’t open yet." };
  const { config } = availability;
  const db = createSupabaseServiceClient();
  const provider = providerFor(config);

  // Housekeeping without a background worker: settle a few orders whose payment page has ended.
  await reconcileDueOrders(config, 5).catch((error) => console.warn("LUMIÈRE checkout: reconciliation skipped:", error));

  const { data, error } = await db.rpc("checkout_create_order", {
    p_request_id: requestId,
    p_items: lines.map((line) => ({ product_id: line.productId, quantity: line.quantity })) as Json,
    p_currency: config.currency,
    p_shipping_cents: config.shippingCents,
    p_provider: provider.id,
    p_hold_minutes: 35,
  });
  if (error || !data) {
    console.error("LUMIÈRE checkout: could not create the order:", error?.message);
    return { ok: false, message: "Checkout couldn’t start. Try again in a moment." };
  }
  const result = data as { ok: boolean; existing?: boolean; order?: CreatedOrder; problems?: { product_id?: string; reason: CheckoutProblem["reason"]; available?: number }[] };
  if (!result.ok || !result.order) {
    const problems = (result.problems ?? []).map((problem) => ({ productId: problem.product_id ?? null, reason: problem.reason, available: problem.available }));
    return { ok: false, message: "Some pendants in your cart have changed. Review the cart, then check out again.", problems };
  }

  const order = result.order;
  if (result.existing) {
    // The same click arriving twice: send it to the payment page the first one opened, while it is still open.
    const open = order.payment_status === "pending" && order.checkout_url && order.checkout_expires_at && Date.parse(order.checkout_expires_at) > Date.now() + 60_000;
    if (open) return { ok: true, url: order.checkout_url! };
    return { ok: false, message: "That checkout has already ended. Check out again to start a new one.", retryWithNewRequest: true };
  }

  const created = Date.now();
  const expiresAt = new Date(created + SESSION_LIFETIME_MS);
  let session;
  try {
    session = await provider.createCheckout({
      orderId: order.id,
      orderNumber: order.number,
      currency: config.currency,
      lines: (order.items ?? []).map((item) => ({
        name: productTitle({ name: item.name, finish: item.finish }),
        description: `LUMIÈRE pendant · order ${order.number}`,
        unitAmount: item.unit_price_cents,
        quantity: item.quantity,
        imageUrl: null,
      })),
      shipping: { label: config.shippingLabel, amount: config.shippingCents, countries: config.shippingCountries },
      tax: config.tax,
      successUrl: `${config.siteUrl}/checkout/complete?order=${order.public_token}`,
      cancelUrl: `${config.siteUrl}/checkout/canceled?order=${order.public_token}`,
      expiresAt,
    });
  } catch (error) {
    // A definite refusal means no payment page exists: give the stock back now. Otherwise (network trouble) the page may exist,
    // and reconciliation releases the order only once any such page has certainly expired.
    const definite = error instanceof Stripe.errors.StripeError && error.type !== "StripeConnectionError" && error.type !== "StripeAPIError";
    console.error(`LUMIÈRE checkout: could not open the payment page for ${order.number}:`, error instanceof Error ? error.message : error);
    if (definite) await applyReport(null, null, { orderId: order.id, sessionId: "", outcome: "failed", details: {} }, "canceled").catch(() => {});
    return { ok: false, message: "The payment page couldn’t be opened. Nothing was charged; try again in a moment." };
  }

  const { error: attachError } = await db.rpc("checkout_attach_session", {
    p_order_id: order.id,
    p_session_id: session.sessionId,
    p_url: session.url,
    p_expires_at: session.expiresAt.toISOString(),
  });
  if (attachError) {
    // The payment page exists but isn't recorded. End it if possible; if it is paid anyway, the webhook adopts it.
    console.error(`LUMIÈRE checkout: could not record the payment page for ${order.number}:`, attachError.message);
    if (await provider.expire(session.sessionId).catch(() => false)) {
      await applyReport(null, null, { orderId: order.id, sessionId: session.sessionId, outcome: "expired", details: {} }).catch(() => {});
    }
    return { ok: false, message: "Checkout couldn’t start. Nothing was charged; try again in a moment." };
  }
  return { ok: true, url: session.url };
}

/**
 * Applies a provider report to its order. Idempotent: with an event ID, a repeated delivery changes nothing; without one
 * (reconciliation), the database only allows forward transitions anyway. Throws when the database can't be reached, so a
 * webhook answers with an error and the provider retries.
 */
export async function applyReport(eventId: string | null, eventType: string | null, report: PaymentReport, outcomeOverride?: "canceled") {
  if (report.outcome === "open" || !report.orderId) return { result: "ignored" as const };
  const db = createSupabaseServiceClient();
  const { data, error } = await db.rpc("checkout_apply_outcome", {
    p_event_id: eventId,
    p_event_type: eventType,
    p_provider: "stripe",
    p_order_id: report.orderId,
    p_session_id: report.sessionId || null,
    p_outcome: outcomeOverride ?? report.outcome,
    p_details: report.details as Json,
  });
  if (error) throw new Error(`checkout_apply_outcome failed: ${error.message}`);
  return data as { result: string; payment_status?: string };
}

/** Settles open orders whose payment page should have ended, by asking the provider. Never releases stock on a guess. */
export async function reconcileDueOrders(config: CheckoutConfig, limit = 10): Promise<number> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db.rpc("checkout_orders_to_reconcile", { p_limit: limit });
  if (error) throw new Error(error.message);
  const provider = providerFor(config);
  let settled = 0;
  for (const order of data ?? []) {
    if (!order.checkout_session_id) {
      // Never got a payment page, and any page it might have had has expired by now (see SESSION_LIFETIME_MS).
      await applyReport(null, "reconcile", { orderId: order.id, sessionId: "", outcome: "failed", details: {} }, "canceled");
      settled++;
      continue;
    }
    const report = await provider.retrieve(order.checkout_session_id);
    if (report.outcome === "open") continue;
    await applyReport(null, "reconcile", { ...report, orderId: order.id });
    settled++;
  }
  return settled;
}

export type OrderStatus = {
  id: string;
  number: string;
  payment_status: string;
  fulfillment_status: string;
  currency: string;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number | null;
  total_cents: number;
  amount_paid_cents: number | null;
  created_at: string;
  checkout_session_id: string | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  items: { name: string; finish: string; slug: string; image_off: string; unit_price_cents: number; quantity: number; line_total_cents: number }[];
};

const TOKEN = /^[0-9a-f]{64}$/;


async function readStatus(token: string): Promise<OrderStatus | null> {
  const { data, error } = await createSupabaseServiceClient().rpc("checkout_order_status", { p_token: token });
  if (error) throw new Error(error.message);
  return (data as OrderStatus | null) ?? null;
}

/**
 * The customer's status page. While the order is still open, the server asks the provider directly (verified data), so a
 * missed webhook can't leave the page stale. Visiting this page never marks anything paid by itself.
 */
export async function orderStatusForCustomer(token: string, intent: "complete" | "canceled"): Promise<OrderStatus | null> {
  if (!TOKEN.test(token)) return null;
  const availability = getCheckoutAvailability();
  if (availability.status !== "ready") return null;
  const status = await readStatus(token);
  if (!status || !status.checkout_session_id || !["pending", "processing"].includes(status.payment_status)) return status;

  const provider = providerFor(availability.config);
  try {
    // Back from the payment page without paying: end that page now, so the pendants go back on sale straight away.
    if (intent === "canceled" && status.payment_status === "pending") await provider.expire(status.checkout_session_id);
    const report = await provider.retrieve(status.checkout_session_id);
    if (report.outcome !== "open") await applyReport(null, `customer_${intent}`, { ...report, orderId: status.id });
  } catch (error) {
    console.warn(`LUMIÈRE checkout: could not confirm order ${status.number} with the provider:`, error instanceof Error ? error.message : error);
  }
  return readStatus(token);
}
