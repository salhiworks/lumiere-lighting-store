import type { Metadata } from "next";
import { DemoOverview } from "@/components/demo-admin/demo-overview";

export const metadata: Metadata = { title: "Overview" };

export default function DemoAdminOverviewPage() {
  return <DemoOverview />;
}
