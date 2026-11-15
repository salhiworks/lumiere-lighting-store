import type { Metadata } from "next";
import { AdminFrame } from "@/components/admin/admin-frame";
import { ProductTable } from "@/components/admin/product-table";
import { ProductsHeader } from "@/components/admin/products-header";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminCollections, listAdminProducts } from "@/lib/admin/catalog";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const session = await requireAdmin();
  const [products, collections] = await Promise.all([listAdminProducts(session), listAdminCollections(session)]);
  const hidden = products.filter((product) => !product.published).length;
  const low = products.filter((product) => product.published && product.stock <= 5).length;

  return (
    <AdminFrame email={session.email}>
      <ProductsHeader visible={products.length - hidden} hidden={hidden} low={low} newHref="/admin/products/new" />
      <ProductTable products={products} collections={collections} />
    </AdminFrame>
  );
}
