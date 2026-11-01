import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { CATALOG_TAG } from "@/lib/catalog";
import { PUBLIC_DEMO } from "@/lib/public-demo";
import { getCheckoutAvailability } from "@/lib/checkout/config";
import { applyReport } from "@/lib/checkout/orders";
import { sessionReport, stripeClient } from "@/lib/payments/stripe";
import type { PaymentOutcome } from "@/lib/payments/types";

/*
 * Stripe's notifications about Checkout Sessions. Point a webhook endpoint at https://<your-domain>/api/webhooks/stripe with the
 * four events below, and put its signing secret in STRIPE_WEBHOOK_SECRET.
 *
 * - The signature is checked against the raw, unmodified body.
 * - Each event is applied once (the database records its ID), in whatever order events arrive.
 * - If the database can't record it, the answer is a 500, so Stripe retries later instead of losing the event.
 */

const OUTCOMES: Record<string, (session: Stripe.Checkout.Session) => PaymentOutcome> = {
  // Paid now, or complete with a delayed payment method still on its way.
  "checkout.session.completed": (session) => (session.payment_status === "unpaid" ? "processing" : "paid"),
  "checkout.session.async_payment_succeeded": () => "paid",
  "checkout.session.async_payment_failed": () => "failed",
  "checkout.session.expired": () => "expired",
};

export async function POST(request: Request) {
  if (PUBLIC_DEMO) return Response.json({ error: "Not found." }, { status: 404 });
  const availability = getCheckoutAvailability();
  if (availability.status !== "ready") {
    // Not configured on this server: ask Stripe to retry later rather than acknowledging something we couldn't process.
    return Response.json({ error: "Checkout is not configured on this server." }, { status: 503 });
  }
  const { config } = availability;

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing Stripe-Signature header." }, { status: 400 });
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripeClient(config).webhooks.constructEventAsync(body, signature, config.stripeWebhookSecret);
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  const outcomeOf = OUTCOMES[event.type];
  if (!outcomeOf) return Response.json({ received: true, ignored: event.type });

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.object !== "checkout.session" || !session.metadata?.order_id) {
    // Not one of this store's checkouts (for example another app on the same Stripe account).
    return Response.json({ received: true, ignored: "not a LUMIÈRE checkout" });
  }

  try {
    const result = await applyReport(event.id, event.type, sessionReport(session, outcomeOf(session)));
    // Stock may have changed (released, or re-reserved for a late payment).
    revalidateTag(CATALOG_TAG, "max");
    return Response.json({ received: true, result: result.result });
  } catch (error) {
    console.error(`LUMIÈRE webhook: could not apply ${event.type} ${event.id}:`, error instanceof Error ? error.message : error);
    return Response.json({ error: "Could not record the event; retry later." }, { status: 500 });
  }
}
