import { Suspense } from "react";
import Link from "next/link";
import { CartButton } from "@/components/cart/cart-button";
import { NavLinks, NavLinksFallback } from "./nav-links";
import { Wordmark } from "./wordmark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="shell flex h-16 items-center gap-2">
        <Link href="/" aria-label="LUMIÈRE, home" className="-ml-1 mr-auto rounded-sm px-1 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Wordmark />
        </Link>
        <nav aria-label="Main">
          <Suspense fallback={<NavLinksFallback />}>
            <NavLinks />
          </Suspense>
        </nav>
        <CartButton />
      </div>
    </header>
  );
}
