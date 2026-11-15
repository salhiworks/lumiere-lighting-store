import * as React from "react";
import Link from "next/link";
import { isLocalProductId } from "@/lib/demo-admin/ids";

type ProductLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & { product: { id: string; slug: string } };

/*
 * A link to a product page. Products created in the public demo exist only in this browser, so the server can't prefetch or render
 * them: their links are plain page loads, and the page draws them from local storage. Every other product gets a normal Next.js link.
 */
export function ProductLink({ product, prefetch, ...props }: ProductLinkProps) {
  const href = `/shop/${product.slug}`;
  if (isLocalProductId(product.id)) {
    const { replace: _replace, scroll: _scroll, onNavigate: _onNavigate, ...anchor } = props;
    void _replace;
    void _scroll;
    void _onNavigate;
    return <a href={href} {...(anchor as React.ComponentProps<"a">)} />;
  }
  return <Link href={href} prefetch={prefetch} {...props} />;
}
