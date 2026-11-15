import type { Metadata } from "next";
import { AdminFrame } from "@/components/admin/admin-frame";
import { AdminHeader } from "@/components/admin/admin-header";
import { SetupNotice } from "@/components/admin/setup-notice";
import { StudioOverview } from "@/components/admin/studio-overview";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminCollections, listAdminProducts } from "@/lib/admin/catalog";
import type { OrderSummary } from "@/lib/admin/order-format";
import { listAdminOrders } from "@/lib/admin/orders";
import { getSupabaseConfig, SupabaseConfigError } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Overview" };

/*
 * The admin's landing page. Products, collections and orders are read with the administrator's own session (Row Level Security
 * decides); orders are optional here, so a store without checkout set up still gets its catalog overview.
 */
export default async function AdminOverviewPage() {
  let configured = false;
  try {
    configured = getSupabaseConfig() !== null;
  } catch (error) {
    if (!(error instanceof SupabaseConfigError)) throw error;
    return <Unconfigured problem={error.message} />;
  }
  if (!configured) return <Unconfigured />;

  const session = await requireAdmin();
  const [products, collections, orders] = await Promise.all([
    listAdminProducts(session),
    listAdminCollections(session),
    listAdminOrders(session, 50).then(
      (list): { list: OrderSummary[] | null; problem?: string } => ({ list }),
      (error: unknown) => ({ list: null, problem: `Orders couldn’t be loaded (${error instanceof Error ? error.message : "unknown error"}).` }),
    ),
  ]);

  return (
    <AdminFrame email={session.email}>
      <StudioOverview base="/admin" products={products} collections={collections} orders={orders.list} ordersProblem={orders.problem} />
    </AdminFrame>
  );
}

function Unconfigured({ problem }: { problem?: string }) {
  return (
    <>
      <AdminHeader />
      <main id="main" tabIndex={-1} className="flex-1 pb-24 outline-none">
        <div className="shell">
          <SetupNotice problem={problem} />
        </div>
      </main>
    </>
  );
}
