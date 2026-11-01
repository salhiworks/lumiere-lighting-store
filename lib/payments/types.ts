/*
 * What the ordering system needs from a payment provider. Orders, stock and the state machine (supabase/migrations/…_orders_checkout.sql)
 * know nothing about Stripe; a different provider only has to implement this interface and its own webhook route.
 */

export type CheckoutLine = { name: string; description: string; unitAmount: number; quantity: number; imageUrl: string | null };

export type CheckoutRequest = {
  orderId: string;
  orderNumber: string;
  currency: string;
  lines: CheckoutLine[];
  shipping: { label: string; amount: number; countries: string[] };
  tax: "none" | "stripe";
  successUrl: string;
  cancelUrl: string;
  expiresAt: Date;
};

export type HostedCheckout = { sessionId: string; url: string; expiresAt: Date };

/** The provider's verdict on a payment, in the order system's terms. "open" means it can still go either way: change nothing. */
export type PaymentOutcome = "paid" | "processing" | "failed" | "expired" | "open";

export type PaymentDetails = {
  payment_intent?: string | null;
  amount_total?: number | null;
  amount_tax?: number | null;
  customer?: { email?: string | null; name?: string | null; phone?: string | null };
  shipping?: { name?: string | null; address?: Record<string, string | null> | null };
};

export type PaymentReport = { orderId: string | null; sessionId: string; outcome: PaymentOutcome; details: PaymentDetails };

export interface PaymentProvider {
  readonly id: string;
  createCheckout(request: CheckoutRequest): Promise<HostedCheckout>;
  /** Asks the provider directly (verified data, not the browser's word) how a checkout ended. */
  retrieve(sessionId: string): Promise<PaymentReport>;
  /** Ends a checkout that hasn't been paid, so its stock can be released safely. Returns false if it can no longer be ended. */
  expire(sessionId: string): Promise<boolean>;
}
