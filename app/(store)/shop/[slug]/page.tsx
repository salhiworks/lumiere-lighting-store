import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoProduct } from "@/components/demo-admin/demo-product";
import { ProductDetail, relatedProducts } from "@/components/product/product-detail";
import { getCollections, getProductBySlug, getProducts } from "@/lib/catalog";
import { productTitle } from "@/lib/catalog/helpers";
import { formatPrice } from "@/lib/format";
import { PUBLIC_DEMO } from "@/lib/public-demo";

/*
 * Every published product is prerendered. proxy.ts answers unknown and hidden slugs with the store's 404 page before this page
 * runs. The page still looks the product up before anything streams (in case the proxy couldn't reach the database); waiting for
 * that lookup is allowed here (instant = false), and product cards prefetch the full page, so clicking one shows it straight away.
 */
export const instant = false;

export async function generateStaticParams() {
  const products = await getProducts();
  // Cache Components needs at least one entry; an empty catalog prerenders a placeholder, which proxy.ts answers with a 404.
  return products.length ? products.map((product) => ({ slug: product.slug })) : [{ slug: "no-products-yet" }];
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Pendant not found" };
  const title = productTitle(product);
  return {
    title,
    description: `${product.summary} ${formatPrice(product.priceCents, product.currency)}.`,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      title,
      description: product.summary,
      images: [{ url: product.images.on, width: product.images.width, height: product.images.height, alt: product.images.alt }],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  // The public demo re-renders this page in the browser with the visitor's Demo Admin edits (a hidden pendant then shows "not found").
  if (PUBLIC_DEMO) return <DemoProduct slug={product.slug} products={products} collections={collections} />;
  const collection = collections.find((item) => item.id === product.collection) ?? { id: product.collection, name: "Collection", description: "" };
  return <ProductDetail product={product} collection={collection} related={relatedProducts(product, products)} />;
}
