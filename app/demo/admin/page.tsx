import type { Metadata } from "next";
import { DemoProducts } from "@/components/demo-admin/demo-products";

export const metadata: Metadata = { title: "Products" };

export default function DemoAdminProductsPage() {
  return <DemoProducts />;
}
