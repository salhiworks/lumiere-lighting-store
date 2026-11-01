import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getCheckoutAvailability } from "./config";

const TOKEN = /^[0-9a-f]{64}$/;

/** For proxy.ts: whether an order status link points at a real order, so unknown links get a true 404. Null when it can't tell. */
export async function orderTokenExists(token: string): Promise<boolean | null> {
  if (!TOKEN.test(token) || getCheckoutAvailability().status !== "ready") return false;
  const { data, error } = await createSupabaseServiceClient().rpc("checkout_order_status", { p_token: token });
  return error ? null : data !== null;
}
