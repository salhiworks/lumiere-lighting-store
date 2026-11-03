import type { Metadata } from "next";
import { DemoCollections } from "@/components/demo-admin/demo-collections";
import { CollectionsView } from "@/components/shop/collections-view";
import { getCollectionsWithProducts } from "@/lib/catalog";
import { PUBLIC_DEMO } from "@/lib/public-demo";

export const metadata: Metadata = {
  title: "Collections",
  description: "Pendants grouped by the light they give: focused metal and concrete, room-filling glass, soft paper and rattan.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const collections = await getCollectionsWithProducts();
  if (PUBLIC_DEMO) return <DemoCollections collections={collections.map((entry) => entry.collection)} products={collections.flatMap((entry) => entry.products)} />;
  return <CollectionsView collections={collections} />;
}
