import type { Metadata } from "next";
import { DemoProductEditor } from "@/components/demo-admin/demo-product-editor";

export const metadata: Metadata = { title: "New product" };

export default function DemoAdminNewProductPage() {
  return <DemoProductEditor />;
}
