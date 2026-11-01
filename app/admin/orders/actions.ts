"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { getCheckoutAvailability } from "@/lib/checkout/config";
import { applyReport, providerFor } from "@/lib/checkout/orders";

/*
 * Order actions in the admin. Administrators change fulfillment only; payment status always comes from the payment provider,
 * and the database refuses fulfillment changes for orders that aren't paid.
 */

const ORDER_ID = z.uuid();

export type FulfillmentState = { status: "idle" | "error" | "success"; message?: string; fieldErrors?: Partial<Record<"carrier" | "trackingNumber" | "trackingUrl" | "note", string>> };

const fulfillmentInput = z.object({
  orderId: ORDER_ID,
  status: z.enum(["unfulfilled", "shipped", "delivered"]),
  carrier: z.string().trim().max(60, "Keep the carrier under 60 characters."),
  trackingNumber: z.string().trim().max(80, "Keep the tracking number under 80 characters."),
  trackingUrl: z.union([z.literal(""), z.url({ protocol: /^https$/, error: "Use a full https:// tracking link." }).max(500)]),
  note: z.string().trim().max(2000, "Keep the note under 2,000 characters."),
});

export async function updateFulfillment(_previous: FulfillmentState, form: FormData): Promise<FulfillmentState> {
  const { supabase } = await requireAdmin();
  const field = (name: string) => String(form.get(name) ?? "");
  const parsed = fulfillmentInput.safeParse({
    orderId: field("orderId"),
    status: field("status"),
    carrier: field("carrier"),
    trackingNumber: field("trackingNumber"),
    trackingUrl: field("trackingUrl").trim(),
    note: field("note"),
  });
  if (!parsed.success) {
    const fieldErrors: FulfillmentState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "carrier" || key === "trackingNumber" || key === "trackingUrl" || key === "note") fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Check the highlighted fields.", fieldErrors };
  }
  const input = parsed.data;
  const { data, error } = await supabase
    .from("orders")
    .update({
      fulfillment_status: input.status,
      carrier: input.carrier || null,
      tracking_number: input.trackingNumber || null,
      tracking_url: input.trackingUrl || null,
      admin_note: input.note || null,
    })
    .eq("id", input.orderId)
    .select("id")
    .maybeSingle();
  if (error) {
    if (error.code === "23514" && /paid/i.test(error.message)) return { status: "error", message: "Only paid orders can be marked shipped or delivered." };
    return { status: "error", message: `The order couldn’t be saved: ${error.message}` };
  }
  if (!data) return { status: "error", message: "The order couldn’t be saved. It may no longer exist, or your access changed." };
  refresh();
  return { status: "success", message: "Saved." };
}

export type RecheckState = { message?: string; error?: boolean };

/* Asks the payment provider about this order now: the fix for a missed webhook. It can only ever apply what the provider says. */
export async function recheckPayment(_previous: RecheckState, form: FormData): Promise<RecheckState> {
  const { supabase } = await requireAdmin();
  const id = ORDER_ID.safeParse(String(form.get("orderId") ?? ""));
  if (!id.success) return { message: "Unknown order.", error: true };
  const availability = getCheckoutAvailability();
  if (availability.status !== "ready") return { message: "Checkout isn’t configured on this server, so Stripe can’t be asked.", error: true };

  const { data: order } = await supabase.from("orders").select("id, checkout_session_id").eq("id", id.data).maybeSingle();
  if (!order) return { message: "Unknown order.", error: true };
  if (!order.checkout_session_id) return { message: "This order never reached the payment page; it is released automatically after 45 minutes." };
  try {
    const report = await providerFor(availability.config).retrieve(order.checkout_session_id);
    if (report.outcome === "open") return { message: "Stripe says the payment page is still open. Nothing to change yet." };
    const result = await applyReport(null, "admin_recheck", { ...report, orderId: order.id });
    updateTag(CATALOG_TAG);
    refresh();
    return { message: result.result === "already_final" || result.result === "ignored" ? "Already up to date with Stripe." : "Updated from Stripe." };
  } catch (error) {
    return { message: `Stripe couldn’t be reached: ${error instanceof Error ? error.message : "unknown error"}`, error: true };
  }
}
