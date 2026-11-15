import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoProductEditor } from "@/components/demo-admin/demo-product-editor";
import { demoProductIds } from "@/lib/demo-admin/catalog";
import { isLocalProductId } from "@/lib/demo-admin/ids";

export const metadata: Metadata = { title: "Edit product" };

/* Visitor-created products (local-…) exist only in the visitor's browser, so their IDs can't be listed at build time: allowed to block. */
export const instant = false;

export function generateStaticParams() {
  return demoProductIds.map((id) => ({ id }));
}

export default async function DemoAdminProductPage({ params }: PageProps<"/demo/admin/products/[id]">) {
  const { id } = await params;
  if (!demoProductIds.includes(id) && !isLocalProductId(id)) notFound();
  return <DemoProductEditor id={id} />;
}
