import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminProduct, listAdminCollections } from "@/lib/admin/catalog";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const session = await requireAdmin();
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const [product, collections] = await Promise.all([getAdminProduct(session, id), listAdminCollections(session)]);
  if (!product) notFound();

  return (
    <>
      <AdminHeader email={session.email} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <div className="shell pt-8">
          <Link href="/admin" className="inline-flex items-center gap-1.5 rounded-sm text-[13px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
            <ArrowLeft className="size-3.5" aria-hidden="true" /> All products
          </Link>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-display text-[clamp(2.2rem,4vw,3rem)] font-light leading-none tracking-[-0.02em]">
              {product.name} <span className="text-muted-foreground">· {product.finish}</span>
            </h1>
            <span className="font-mono text-[12px] text-muted-foreground">ID {product.id}</span>
          </div>
          <ProductForm product={product} collections={collections} created={created === "1"} />
        </div>
      </main>
    </>
  );
}
