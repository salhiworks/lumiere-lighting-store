"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { AdminNav, type AdminNavLink } from "@/components/admin/admin-nav";
import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";
import { demoStore } from "@/lib/demo-admin/store";

const LINKS: AdminNavLink[] = [
  { href: "/demo/admin", label: "Products", active: (path) => path === "/demo/admin" || path.startsWith("/demo/admin/products") },
  { href: "/demo/admin/orders", label: "Orders", active: (path) => path.startsWith("/demo/admin/orders") },
];

/* The Demo Admin Dashboard's header: the real admin's look and navigation, with Reset Demo where the real one has Sign out. */
export function DemoAdminHeader() {
  const [message, setMessage] = React.useState("");
  const reset = () => {
    demoStore.reset();
    setMessage("Demo reset. The sample pendants and orders are back as they were.");
  };
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="shell flex min-h-16 flex-wrap items-center gap-x-3 gap-y-1 py-2">
        <Link href="/demo/admin" className="flex items-baseline gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Wordmark className="text-[1.15rem]" />
          <span className="eyebrow">Demo admin</span>
        </Link>
        <div className="ml-2 mr-auto sm:ml-4">
          <AdminNav links={LINKS} />
        </div>
        <Link
          href="/"
          className="hidden h-9 items-center gap-1 rounded-full px-3 text-[13px] font-medium text-foreground/75 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
        >
          View store <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          <RotateCcw aria-hidden="true" /> Reset Demo
        </Button>
      </div>
      <p role="status" aria-live="polite" className={message ? "border-t border-border/60 bg-secondary/60 py-1.5 text-center text-[12.5px]" : "sr-only"}>
        {message}
      </p>
    </header>
  );
}
