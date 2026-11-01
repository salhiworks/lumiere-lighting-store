import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { FulfillmentForm, RecheckPayment } from "@/components/admin/fulfillment-form";
import { FormSection } from "@/components/admin/form-controls";
import { PaymentBadge } from "@/components/admin/order-badges";
import { requireAdmin } from "@/lib/admin/auth";
import { chargedCents } from "@/lib/admin/order-format";
import { getAdminOrder } from "@/lib/admin/orders";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Order" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const when = (value: string | null) => (value ? `${dateFormat.format(new Date(value))} UTC` : null);
const regions = new Intl.DisplayNames(["en"], { type: "region" });

function addressLines(address: Record<string, string | null>) {
  const locality = [[address.city, address.state].filter(Boolean).join(", "), address.postal_code].filter(Boolean).join(" ");
  const country = address.country ? (regions.of(address.country) ?? address.country) : null;
  return [address.line1, address.line2, locality, country].filter((line): line is string => Boolean(line));
}

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const session = await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const detail = await getAdminOrder(session, id);
  if (!detail) notFound();
  const { order, lines, events } = detail;
  const address = (order.shipping_address ?? null) as Record<string, string | null> | null;
  const open = order.payment_status === "pending" || order.payment_status === "processing";

  return (
    <>
      <AdminHeader email={session.email} />
      <main id="main" tabIndex={-1} className="flex-1 pb-24 outline-none">
        <div className="shell">
          <Link href="/admin/orders" className="mt-8 inline-flex items-center gap-1.5 rounded-sm text-[13px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
            <ArrowLeft className="size-3.5" aria-hidden="true" /> All orders
          </Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Order · {when(order.created_at)}</p>
              <h1 className="mt-2 font-mono text-[clamp(1.8rem,3.4vw,2.4rem)] font-medium leading-none tracking-tight">{order.number}</h1>
            </div>
            <PaymentBadge status={order.payment_status} className="text-sm" />
          </div>
          {order.payment_status === "needs_review" && order.review_reason && (
            <p role="alert" className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm leading-relaxed text-destructive">
              {order.review_reason} Check the payment in Stripe before shipping, and refund there if needed.
            </p>
          )}

          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-14">
            <div className="grid content-start gap-10">
              <FormSection title="Pendants" description="As purchased: names and prices are frozen at checkout and never follow later product edits.">
                <ul className="border-t border-border">
                  {lines.map((line) => (
                    <li key={line.id} className="flex items-baseline justify-between gap-4 border-b border-border py-3.5 text-sm">
                      <span className="min-w-0">
                        <span className="font-medium">
                          {line.product_name} · {line.product_finish}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {line.quantity} × {formatPrice(line.unit_price_cents, line.currency)}
                        </span>
                      </span>
                      <span className="tabular-nums">{formatPrice(line.line_total_cents, line.currency)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="text-right tabular-nums">{formatPrice(order.subtotal_cents, order.currency)}</dd>
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="text-right tabular-nums">{formatPrice(order.shipping_cents, order.currency)}</dd>
                  {order.tax_cents ? (
                    <>
                      <dt className="text-muted-foreground">Tax (from Stripe)</dt>
                      <dd className="text-right tabular-nums">{formatPrice(order.tax_cents, order.currency)}</dd>
                    </>
                  ) : null}
                  <dt className="mt-1 border-t border-border pt-2.5 font-medium">{order.amount_paid_cents !== null ? "Charged" : "Total"}</dt>
                  <dd className="mt-1 border-t border-border pt-2.5 text-right font-display text-xl tabular-nums">{formatPrice(chargedCents(order), order.currency)}</dd>
                </dl>
              </FormSection>

              <FormSection title="Payment" description="Recorded from Stripe only. It can’t be changed by hand.">
                <dl className="grid grid-cols-[9rem_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <PaymentBadge status={order.payment_status} />
                  </dd>
                  {order.paid_at && (
                    <>
                      <dt className="text-muted-foreground">Paid</dt>
                      <dd>{when(order.paid_at)}</dd>
                    </>
                  )}
                  <dt className="text-muted-foreground">Stock</dt>
                  <dd>{order.stock_reserved ? "Reserved for this order" : `Released${order.released_at ? ` ${when(order.released_at)}` : ""}`}</dd>
                  <dt className="text-muted-foreground">Checkout session</dt>
                  <dd className="truncate font-mono text-[12.5px]">{order.checkout_session_id ?? "—"}</dd>
                  <dt className="text-muted-foreground">Payment intent</dt>
                  <dd className="truncate font-mono text-[12.5px]">{order.payment_intent_id ?? "—"}</dd>
                </dl>
                {open && <RecheckPayment orderId={order.id} />}
                {events.length > 0 && (
                  <ol className="border-l border-border pl-4 text-[12.5px] text-muted-foreground">
                    {events.map((event) => (
                      <li key={event.id} className="py-1">
                        <span className="font-mono">{event.type}</span> → {event.result} · {when(event.received_at)}
                      </li>
                    ))}
                  </ol>
                )}
              </FormSection>
            </div>

            <div className="grid content-start gap-10">
              <FormSection title="Customer">
                {order.customer_email || order.customer_name ? (
                  <div className="text-sm leading-relaxed">
                    <p className="font-medium">{order.customer_name}</p>
                    {order.customer_email && (
                      <a href={`mailto:${order.customer_email}`} className="underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground">
                        {order.customer_email}
                      </a>
                    )}
                    {order.customer_phone && <p className="text-muted-foreground">{order.customer_phone}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Entered on the Stripe payment page; it appears here once the payment completes.</p>
                )}
              </FormSection>
              <FormSection title="Ship to">
                {address ? (
                  <address className="text-sm not-italic leading-relaxed">
                    {order.shipping_name && <span className="block font-medium">{order.shipping_name}</span>}
                    {addressLines(address).map((part) => (
                        <span key={part} className="block">
                          {part}
                        </span>
                      ))}
                  </address>
                ) : (
                  <p className="text-sm text-muted-foreground">No shipping address yet.</p>
                )}
              </FormSection>
              <FormSection title="Fulfillment">
                <FulfillmentForm order={order} />
              </FormSection>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
