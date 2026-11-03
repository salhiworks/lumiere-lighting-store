import { Suspense } from "react";
import Link from "next/link";
import { CartButton } from "@/components/cart/cart-button";
import { PUBLIC_DEMO } from "@/lib/public-demo";
import { DemoDashboardLink } from "@/components/demo-admin/demo-dashboard-link";
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
        {PUBLIC_DEMO && <DemoDashboardLink className="ml-1 hidden md:inline-flex" />}
        <CartButton />
      </div>
      {/* Mobile navigation: the header row has no room for a fourth link, so the demo dashboard gets its own strip under it. */}
      {PUBLIC_DEMO && (
        <nav aria-label="Demo" className="border-t border-border/60 md:hidden">
          <div className="shell flex h-10 items-center justify-between gap-3">
            <span className="text-[12px] text-muted-foreground">Public demo</span>
            <DemoDashboardLink />
          </div>
        </nav>
      )}
    </header>
  );
}
