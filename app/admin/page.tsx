import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProductTable } from "@/components/admin/product-table";
import { SetupNotice } from "@/components/admin/setup-notice";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminCollections, listAdminProducts } from "@/lib/admin/catalog";
import { getSupabaseConfig, SupabaseConfigError } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  let configured = false;
  try {
    configured = getSupabaseConfig() !== null;
  } catch (error) {
    if (!(error instanceof SupabaseConfigError)) throw error;
    return <AdminPage><SetupNotice problem={error.message} /></AdminPage>;
  }
  if (!configured) return <AdminPage><SetupNotice /></AdminPage>;

  const session = await requireAdmin();
  const [products, collections] = await Promise.all([listAdminProducts(session), listAdminCollections(session)]);
  const hidden = products.filter((product) => !product.published).length;
  const low = products.filter((product) => product.published && product.stock <= 5).length;

  return (
    <AdminPage email={session.email}>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-10">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="mt-2 font-display text-[clamp(2.2rem,4vw,3rem)] font-light leading-none tracking-[-0.02em]">Products</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {products.length - hidden} visible in the store · {hidden} hidden{low > 0 && ` · ${low} low on stock or sold out`}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus aria-hidden="true" /> New product
          </Link>
        </Button>
      </div>
      <ProductTable products={products} collections={collections} />
    </AdminPage>
  );
}

function AdminPage({ email, children }: { email?: string | null; children: React.ReactNode }) {
  return (
    <>
      <AdminHeader email={email} />
      <main id="main" tabIndex={-1} className="flex-1 pb-24 outline-none">
        <div className="shell">{children}</div>
      </main>
    </>
  );
}
