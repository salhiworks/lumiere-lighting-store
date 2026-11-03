import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoProductEditor } from "@/components/demo-admin/demo-product-editor";
import { demoProductIds } from "@/lib/demo-admin/catalog";

export const metadata: Metadata = { title: "Edit product" };

export function generateStaticParams() {
  return demoProductIds.map((id) => ({ id }));
}

export default async function DemoAdminProductPage({ params }: PageProps<"/demo/admin/products/[id]">) {
  const { id } = await params;
  if (!demoProductIds.includes(id)) notFound();
  return <DemoProductEditor id={id} />;
}
