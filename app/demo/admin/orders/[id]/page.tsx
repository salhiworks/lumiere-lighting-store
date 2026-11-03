import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoOrderDetail } from "@/components/demo-admin/demo-orders";
import { demoOrders } from "@/lib/demo-admin/orders";

export const metadata: Metadata = { title: "Order" };

export function generateStaticParams() {
  return demoOrders.map((order) => ({ id: order.id }));
}

export default async function DemoAdminOrderPage({ params }: PageProps<"/demo/admin/orders/[id]">) {
  const { id } = await params;
  if (!demoOrders.some((order) => order.id === id)) notFound();
  return <DemoOrderDetail id={id} />;
}
