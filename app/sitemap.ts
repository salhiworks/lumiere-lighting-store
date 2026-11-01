import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/catalog";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/shop", "/collections"].map((path) => ({ url: `${site.url}${path}` }));
  const products = (await getProducts()).map((product) => ({ url: `${site.url}/shop/${product.slug}` }));
  return [...pages, ...products];
}
