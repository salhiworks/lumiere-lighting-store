import "server-only";
import { PUBLIC_DEMO } from "@/lib/public-demo";
import { getSupabaseConfig, SupabaseConfigError } from "@/lib/supabase/config";
import { getSupabaseSecretKey } from "@/lib/supabase/service";

/*
 * Checkout is optional. The store, cart and admin work without any of this; checkout opens only once every setting below is
 * present and consistent, and nothing is guessed: no default shipping price, no default tax treatment.
 *
 *   SUPABASE_SECRET_KEY          the server's key for orders (never sent to the browser)
 *   STRIPE_SECRET_KEY            sk_test_… (live keys are refused unless CHECKOUT_ALLOW_LIVE_PAYMENTS=true)
 *   STRIPE_WEBHOOK_SECRET        whsec_… from the webhook endpoint pointing at /api/webhooks/stripe
 *   CHECKOUT_SHIPPING_COUNTRIES  where you ship, as ISO country codes: "US" or "US,CA"
 *   CHECKOUT_SHIPPING_CENTS      one flat shipping charge per order, in cents ("0" for free shipping)
 *   CHECKOUT_TAX                 "none" (prices are final) or "stripe" (Stripe Tax adds tax; set it up in Stripe first)
 *   NEXT_PUBLIC_SITE_URL         the store's public address, for the return links from the payment page
 */

export type CheckoutConfig = {
  provider: "stripe";
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripeApiBase: string | null;
  livePayments: boolean;
  currency: string;
  shippingCountries: string[];
  shippingCents: number;
  shippingLabel: string;
  tax: "none" | "stripe";
  siteUrl: string;
};

export type CheckoutAvailability =
  | { status: "ready"; config: CheckoutConfig }
  | { status: "demo" }
  | { status: "setup"; missing: string[] };

const env = (name: string) => process.env[name]?.trim() || "";

export function getCheckoutAvailability(): CheckoutAvailability {
  let supabase;
  try {
    supabase = getSupabaseConfig();
  } catch (error) {
    if (error instanceof SupabaseConfigError) return { status: "setup", missing: [error.message] };
    throw error;
  }
  if (!supabase) return { status: "demo" };

  const missing: string[] = [];
  if (!getSupabaseSecretKey()) missing.push("SUPABASE_SECRET_KEY (the project's secret key, server only)");

  const stripeSecretKey = env("STRIPE_SECRET_KEY");
  const livePayments = env("CHECKOUT_ALLOW_LIVE_PAYMENTS") === "true";
  if (!stripeSecretKey) missing.push("STRIPE_SECRET_KEY");
  else if (!/^(sk|rk)_(test|live)_/.test(stripeSecretKey)) missing.push("STRIPE_SECRET_KEY must be a Stripe secret key (sk_test_…)");
  else if (/^(sk|rk)_live_/.test(stripeSecretKey) && !livePayments) {
    missing.push("STRIPE_SECRET_KEY is a live key: real payments stay off until CHECKOUT_ALLOW_LIVE_PAYMENTS=true is set deliberately");
  }

  const stripeWebhookSecret = env("STRIPE_WEBHOOK_SECRET");
  if (!stripeWebhookSecret.startsWith("whsec_")) missing.push("STRIPE_WEBHOOK_SECRET (whsec_…)");

  const shippingCountries = env("CHECKOUT_SHIPPING_COUNTRIES")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
  if (!shippingCountries.length || shippingCountries.some((code) => !/^[A-Z]{2}$/.test(code))) {
    missing.push('CHECKOUT_SHIPPING_COUNTRIES (ISO codes, e.g. "US" or "US,CA")');
  }

  const shippingRaw = env("CHECKOUT_SHIPPING_CENTS");
  const shippingCents = /^\d{1,7}$/.test(shippingRaw) ? Number(shippingRaw) : NaN;
  if (!Number.isInteger(shippingCents)) missing.push('CHECKOUT_SHIPPING_CENTS (flat shipping per order in cents, "0" for free)');

  const tax = env("CHECKOUT_TAX");
  if (tax !== "none" && tax !== "stripe") missing.push('CHECKOUT_TAX ("none" if prices are final, or "stripe" for Stripe Tax)');

  const siteUrl = env("NEXT_PUBLIC_SITE_URL").replace(/\/+$/, "");
  if (!/^https?:\/\/[^\s/]+/.test(siteUrl)) missing.push("NEXT_PUBLIC_SITE_URL (the store's public address)");
  else if (siteUrl.startsWith("http://") && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(siteUrl)) {
    missing.push("NEXT_PUBLIC_SITE_URL must use https:// outside local development");
  }

  // Test tooling only (stripe-mock or a local stand-in); ignored for live keys.
  const stripeApiBase = env("STRIPE_API_BASE") || null;
  if (stripeApiBase && /^(sk|rk)_live_/.test(stripeSecretKey)) missing.push("STRIPE_API_BASE can only be used with test keys");

  if (missing.length) return { status: "setup", missing };
  return {
    status: "ready",
    config: {
      provider: "stripe",
      stripeSecretKey,
      stripeWebhookSecret,
      stripeApiBase,
      livePayments: /^(sk|rk)_live_/.test(stripeSecretKey),
      currency: env("CHECKOUT_CURRENCY").toUpperCase() || "USD",
      shippingCountries,
      shippingCents,
      shippingLabel: env("CHECKOUT_SHIPPING_LABEL") || "Shipping",
      tax: tax as "none" | "stripe",
      siteUrl,
    },
  };
}

/** What the storefront may say about checkout. The admin sees the exact missing settings. */
export type CheckoutNotice =
  | { open: true; currency: string; shippingCents: number; shippingCountries: string[]; taxAdded: boolean }
  | { open: false; message: string };

export function getCheckoutNotice(): CheckoutNotice {
  const availability = getCheckoutAvailability();
  if (availability.status === "ready") {
    const { config } = availability;
    return { open: true, currency: config.currency, shippingCents: config.shippingCents, shippingCountries: config.shippingCountries, taxAdded: config.tax === "stripe" };
  }
  if (PUBLIC_DEMO) {
    return { open: false, message: "This is a demonstration storefront, so checkout is turned off and nothing can be ordered. Your cart is saved on this device." };
  }
  if (availability.status === "demo") {
    return { open: false, message: "This is a demo store: browse and build a cart freely. Checkout opens once the store is connected to Supabase and Stripe." };
  }
  return { open: false, message: "Checkout isn’t open yet. Your cart is saved on this device, so you can come back to it." };
}
