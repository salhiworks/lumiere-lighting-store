import { DemoHome } from "@/components/demo-admin/demo-home";
import { HomeBody } from "@/components/home/home-body";
import { getCollectionsWithProducts, getProducts } from "@/lib/catalog";
import { PUBLIC_DEMO } from "@/lib/public-demo";

export default async function HomePage() {
  const [products, collections] = await Promise.all([getProducts(), getCollectionsWithProducts()]);
  // The public demo shows the visitor's Demo Admin edits once the page is in the browser; everywhere else this is the plain page.
  if (PUBLIC_DEMO) return <DemoHome products={products} collections={collections.map((entry) => entry.collection)} />;
  return <HomeBody products={products} collections={collections} />;
}
