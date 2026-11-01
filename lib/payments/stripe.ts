import "server-only";
import Stripe from "stripe";
import type { CheckoutConfig } from "@/lib/checkout/config";
import type { CheckoutRequest, HostedCheckout, PaymentDetails, PaymentOutcome, PaymentProvider, PaymentReport } from "./types";

/* Stripe-hosted Checkout. The Stripe client is created on demand, so nothing here runs (or needs a key) until checkout is set up. */

let cached: { key: string; client: Stripe } | null = null;

export function stripeClient(config: Pick<CheckoutConfig, "stripeSecretKey" | "stripeApiBase">): Stripe {
  if (cached?.key === config.stripeSecretKey + (config.stripeApiBase ?? "")) return cached.client;
  const base = config.stripeApiBase ? new URL(config.stripeApiBase) : null;
  const client = new Stripe(config.stripeSecretKey, {
    maxNetworkRetries: 2,
    timeout: 20_000,
    appInfo: { name: "LUMIÈRE store" },
    ...(base ? { host: base.hostname, port: base.port || undefined, protocol: base.protocol.replace(":", "") as "http" | "https" } : {}),
  });
  cached = { key: config.stripeSecretKey + (config.stripeApiBase ?? ""), client };
  return client;
}

/** How a Checkout Session ended, in the order system's terms. */
export function sessionOutcome(session: Stripe.Checkout.Session): PaymentOutcome {
  if (session.status === "expired") return "expired";
  if (session.status !== "complete") return "open";
  if (session.payment_status === "paid" || session.payment_status === "no_payment_required") return "paid";
  // Complete but unpaid: a delayed payment method (bank debit, voucher) is still on its way, unless it has already failed.
  const intent = typeof session.payment_intent === "object" ? session.payment_intent : null;
  if (intent?.status === "succeeded") return "paid";
  if (intent?.status === "canceled" || intent?.status === "requires_payment_method") return "failed";
  return "processing";
}

export function sessionDetails(session: Stripe.Checkout.Session): PaymentDetails {
  const shipping = session.collected_information?.shipping_details ?? null;
  return {
    payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
    amount_total: session.amount_total,
    amount_tax: session.total_details?.amount_tax ?? null,
    customer: { email: session.customer_details?.email ?? null, name: session.customer_details?.name ?? null, phone: session.customer_details?.phone ?? null },
    shipping: shipping ? { name: shipping.name, address: { ...shipping.address } } : undefined,
  };
}

export function sessionReport(session: Stripe.Checkout.Session, outcome = sessionOutcome(session)): PaymentReport {
  return { orderId: session.metadata?.order_id ?? session.client_reference_id ?? null, sessionId: session.id, outcome, details: sessionDetails(session) };
}

export function stripeProvider(config: CheckoutConfig): PaymentProvider {
  const stripe = stripeClient(config);
  return {
    id: "stripe",

    async createCheckout(request: CheckoutRequest): Promise<HostedCheckout> {
      const currency = request.currency.toLowerCase();
      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          client_reference_id: request.orderId,
          metadata: { order_id: request.orderId, order_number: request.orderNumber },
          payment_intent_data: { metadata: { order_id: request.orderId, order_number: request.orderNumber } },
          line_items: request.lines.map((line) => ({
            quantity: line.quantity,
            price_data: {
              currency,
              unit_amount: line.unitAmount,
              product_data: { name: line.name, description: line.description, ...(line.imageUrl ? { images: [line.imageUrl] } : {}) },
            },
          })),
          shipping_address_collection: {
            allowed_countries: request.shipping.countries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
          },
          shipping_options: [
            { shipping_rate_data: { type: "fixed_amount", display_name: request.shipping.label, fixed_amount: { amount: request.shipping.amount, currency } } },
          ],
          phone_number_collection: { enabled: true },
          automatic_tax: { enabled: request.tax === "stripe" },
          success_url: request.successUrl,
          cancel_url: request.cancelUrl,
          expires_at: Math.floor(request.expiresAt.getTime() / 1000),
        },
        // One Checkout Session per order, even if this request is retried.
        { idempotencyKey: `lumiere-checkout-${request.orderId}` },
      );
      if (!session.url) throw new Error("Stripe returned a Checkout Session without a URL");
      return { sessionId: session.id, url: session.url, expiresAt: new Date(session.expires_at * 1000) };
    },

    async retrieve(sessionId: string): Promise<PaymentReport> {
      const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent"] });
      return sessionReport(session);
    },

    async expire(sessionId: string): Promise<boolean> {
      try {
        const session = await stripe.checkout.sessions.expire(sessionId);
        return session.status === "expired";
      } catch (error) {
        // Already complete or already expired: the caller re-reads the session and applies what it says.
        if (error instanceof Stripe.errors.StripeInvalidRequestError) return false;
        throw error;
      }
    },
  };
}
