"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { CATALOG_TAG } from "@/lib/catalog";
import { startCheckout, type StartCheckoutResult } from "@/lib/checkout/orders";

/*
 * The cart's Checkout button. The browser sends only product IDs and quantities: prices, totals, visibility and stock are all
 * re-read and checked on the server, inside the database transaction that reserves the stock.
 */
const checkoutInput = z.object({
  requestId: z.uuid(),
  lines: z
    .array(z.object({ productId: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(64), quantity: z.number().int().min(1).max(10) }))
    .min(1)
    .max(20),
});

export async function beginCheckout(input: unknown): Promise<StartCheckoutResult> {
  const parsed = checkoutInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Your cart couldn’t be read. Refresh the page and try again.", retryWithNewRequest: true };
  const result = await startCheckout(parsed.data.requestId, parsed.data.lines);
  // Stock changed (reserved or, for a refused cart, possibly out of date in the browser): refresh the cached catalog.
  updateTag(CATALOG_TAG);
  return result;
}
