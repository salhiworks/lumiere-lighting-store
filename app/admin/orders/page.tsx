import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { OrderTable } from "@/components/admin/order-table";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminOrders } from "@/lib/admin/orders";
import { getCheckoutAvailability } from "@/lib/checkout/config";
import { reconcileDueOrders } from "@/lib/checkout/orders";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const session = await requireAdmin();
  const availability = getCheckoutAvailability();
  let reconcileProblem: string | null = null;
  if (availability.status === "ready") {
    // Missed webhooks and abandoned checkouts are settled here, by asking Stripe; there is no background worker to do it.
    await reconcileDueOrders(availability.config, 10).catch((error: unknown) => {
      reconcileProblem = error instanceof Error ? error.message : "unknown error";
    });
  }
  const orders = await listAdminOrders(session);
  const toShip = orders.filter((order) => order.payment_status === "paid" && order.fulfillment_status === "unfulfilled").length;
  const review = orders.filter((order) => order.payment_status === "needs_review").length;

  return (
    <>
      <AdminHeader email={session.email} />
      <main id="main" tabIndex={-1} className="flex-1 pb-24 outline-none">
        <div className="shell">
          <div className="pt-10">
            <p className="eyebrow">Sales</p>
            <h1 className="mt-2 font-display text-[clamp(2.2rem,4vw,3rem)] font-light leading-none tracking-[-0.02em]">Orders</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {toShip} to ship{review > 0 && ` · ${review} need${review === 1 ? "s" : ""} review`} · payment status comes from Stripe
            </p>
          </div>

          {availability.status !== "ready" && (
            <section aria-labelledby="checkout-setup" className="mt-8 rounded-lg border border-border bg-card px-6 py-5">
              <h2 id="checkout-setup" className="text-sm font-medium">
                Checkout is off
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                The store, cart and product editing all work; the cart shows “Checkout unavailable” until these server settings are in place (docs/CHECKOUT.md):
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px]">
                {availability.status === "setup" && availability.missing.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          )}
          {reconcileProblem && (
            <p role="alert" className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Open orders couldn’t be checked with Stripe just now ({reconcileProblem}). They are checked again on the next visit.
            </p>
          )}

          <OrderTable orders={orders} />
        </div>
      </main>
    </>
  );
}
