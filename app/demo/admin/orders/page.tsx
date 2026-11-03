import type { Metadata } from "next";
import { DemoOrders } from "@/components/demo-admin/demo-orders";

export const metadata: Metadata = { title: "Orders" };

export default function DemoAdminOrdersPage() {
  return <DemoOrders />;
}
