import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminFrame } from "@/components/admin/admin-frame";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminCollections } from "@/lib/admin/catalog";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const session = await requireAdmin();
  const collections = await listAdminCollections(session);
  return (
    <AdminFrame email={session.email}>
        <div className="pt-8">
          <Link href="/admin/products" className="inline-flex items-center gap-1.5 rounded-sm text-[13px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
            <ArrowLeft className="size-3.5" aria-hidden="true" /> All products
          </Link>
          <h1 className="mt-4 font-display text-[clamp(2.2rem,4vw,3rem)] font-light leading-none tracking-[-0.02em]">New product</h1>
          <ProductForm collections={collections} />
        </div>
    </AdminFrame>
  );
}
