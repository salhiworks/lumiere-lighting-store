import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/lib/checkout/orders";
import { formatPrice } from "@/lib/format";
import { ClearCart } from "./clear-cart";

/* What a customer sees after the payment page. Every word follows the payment status recorded from Stripe, never the return link. */

const COPY: Record<string, { eyebrow: string; title: string; body: string; lit: boolean }> = {
  paid: {
    eyebrow: "Payment received",
    title: "Thank you. Your order is confirmed.",
    body: "Your payment is confirmed. We pack every lamp by hand; when your order ships, the tracking details appear on this page.",
    lit: true,
  },
  needs_review: {
    eyebrow: "Payment received",
    title: "We’re checking one detail of your order",
    body: "Your payment arrived, and we’re confirming the order by hand before it ships. We’ll contact you at the email you gave at checkout.",
    lit: true,
  },
  processing: {
    eyebrow: "Payment on its way",
    title: "Your bank is still confirming the payment",
    body: "Some payment methods take a few days to clear. Your pendants are held for you meanwhile, and nothing ships until the payment is confirmed.",
    lit: false,
  },
  pending: {
    eyebrow: "Confirming your payment",
    title: "One moment while we hear from Stripe",
    body: "If you just paid, the confirmation is on its way. Refresh this page in a few seconds.",
    lit: false,
  },
  failed: {
    eyebrow: "Payment not completed",
    title: "The payment didn’t go through",
    body: "Nothing was charged, and the pendants are back in the collection. Your cart is still saved on this device if you’d like to try again.",
    lit: false,
  },
  expired: {
    eyebrow: "Checkout ended",
    title: "This checkout has closed",
    body: "Nothing was charged. Your cart is still saved on this device, so you can check out again whenever you’re ready.",
    lit: false,
  },
  canceled: {
    eyebrow: "Checkout ended",
    title: "This checkout has closed",
    body: "Nothing was charged. Your cart is still saved on this device, so you can check out again whenever you’re ready.",
    lit: false,
  },
};

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export function OrderStatusView({ order }: { order: OrderStatus }) {
  const copy = COPY[order.payment_status] ?? COPY.pending;
  const paid = order.payment_status === "paid" || order.payment_status === "needs_review";
  const keepsCart = order.payment_status === "processing" || paid;
  const shipped = paid && order.fulfillment_status !== "unfulfilled";

  return (
    <div className="shell grid gap-12 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-20">
      {keepsCart && <ClearCart />}
      <div>
        <p className="eyebrow flex items-center gap-2.5">
          <span aria-hidden="true" className={copy.lit ? "size-2 rounded-full bg-brass shadow-[0_0_12px_var(--glow)]" : "size-2 rounded-full border border-foreground/40"} />
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.2rem,4.5vw,3.4rem)] font-light leading-[1.05] tracking-[-0.02em]">{copy.title}</h1>
        <p className="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-muted-foreground">{copy.body}</p>

        {shipped && (
          <div className="mt-8 max-w-md rounded-lg border border-border bg-card px-5 py-4">
            <p className="text-sm font-medium">{order.fulfillment_status === "delivered" ? "Delivered" : "On its way"}</p>
            {order.tracking_number && (
              <p className="mt-1 text-[13px] text-muted-foreground">
                {order.carrier ? `${order.carrier} · ` : ""}
                {order.tracking_url ? (
                  <a href={order.tracking_url} className="underline underline-offset-4 hover:text-foreground" rel="noreferrer" target="_blank">
                    {order.tracking_number}
                  </a>
                ) : (
                  order.tracking_number
                )}
              </p>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          {order.payment_status === "pending" ? (
            <Button asChild>
              {/* An empty href reloads this exact address, order key included. */}
              <a href="">Refresh</a>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/shop">{paid ? "Continue browsing" : "Back to the shop"}</Link>
            </Button>
          )}
        </div>
      </div>

      <section aria-labelledby="order-summary" className="rounded-lg border border-border bg-card p-6 sm:p-7">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="order-summary" className="font-display text-xl">
            Order {order.number}
          </h2>
          <p className="text-[13px] text-muted-foreground">{dateFormat.format(new Date(order.created_at))}</p>
        </div>
        <ul className="mt-5 border-t border-border">
          {order.items.map((item) => (
            <li key={`${item.slug}-${item.unit_price_cents}`} className="flex items-baseline justify-between gap-4 border-b border-border py-3.5 text-sm">
              <span className="min-w-0">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {item.finish} · {item.quantity} × {formatPrice(item.unit_price_cents, order.currency)}
                </span>
              </span>
              <span className="tabular-nums">{formatPrice(item.line_total_cents, order.currency)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="text-right tabular-nums">{formatPrice(order.subtotal_cents, order.currency)}</dd>
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="text-right tabular-nums">{order.shipping_cents === 0 ? "Free" : formatPrice(order.shipping_cents, order.currency)}</dd>
          {order.tax_cents ? (
            <>
              <dt className="text-muted-foreground">Tax</dt>
              <dd className="text-right tabular-nums">{formatPrice(order.tax_cents, order.currency)}</dd>
            </>
          ) : null}
          <dt className="mt-2 border-t border-border pt-3 font-medium">{paid ? "Paid" : "Total"}</dt>
          <dd className="mt-2 border-t border-border pt-3 text-right font-display text-xl tabular-nums">
            {formatPrice(order.amount_paid_cents ?? order.total_cents + (order.tax_cents ?? 0), order.currency)}
          </dd>
        </dl>
      </section>
    </div>
  );
}
