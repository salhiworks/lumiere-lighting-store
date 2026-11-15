"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, LayoutGrid, Lamp, Plus, Receipt } from "lucide-react";
import { cn } from "cn";
import { Wordmark } from "@/components/layout/wordmark";

type StudioShellProps = {
  /** Where this dashboard lives: the real admin or the public demo's stand-in. Every link is built from it. */
  base: "/admin" | "/demo/admin";
  /** Says which dashboard this is, next to the wordmark ("Studio", "Demo studio"). */
  badge: string;
  /** The account corner: the administrator and Sign out in the real admin, Reset Demo in the demo. */
  account: React.ReactNode;
  /** A line under the badge, e.g. what the demo is. */
  note?: React.ReactNode;
  children: React.ReactNode;
};

/*
 * The admin's frame, shared by the real admin and the public Demo Admin Dashboard: a graphite studio sidebar on large screens (the
 * evening palette of the storefront's after-dark scene), and on phones a compact bar with the three sections as tabs. Overview,
 * Products and Orders are always one click away, and New product is the one primary action.
 */
export function StudioShell({ base, badge, account, note, children }: StudioShellProps) {
  const pathname = usePathname();
  const links = [
    { href: base, label: "Overview", icon: LayoutGrid, active: pathname === base || pathname === `${base}/` },
    { href: `${base}/products`, label: "Products", icon: Lamp, active: pathname.startsWith(`${base}/products`) && !pathname.startsWith(`${base}/products/new`) },
    { href: `${base}/orders`, label: "Orders", icon: Receipt, active: pathname.startsWith(`${base}/orders`) },
  ];
  const creating = pathname.startsWith(`${base}/products/new`);

  return (
    <div className="flex min-h-svh flex-1 flex-col lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      {/* Large screens: the studio sidebar. */}
      <div className="hidden bg-night lg:block">
        <aside className="sticky top-0 flex h-svh flex-col overflow-y-auto text-night-foreground">
          <div className="px-6 pb-6 pt-7">
            <Link href={base} className="block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ember">
              <Wordmark className="text-[1.2rem]" />
              <span className="mt-2 flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.26em] text-night-muted">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-ember shadow-[0_0_10px_2px_color-mix(in_oklab,var(--ember)_60%,transparent)]" />
                {badge}
              </span>
            </Link>
            {note && <div className="mt-4 text-[12px] leading-relaxed text-night-muted">{note}</div>}
          </div>

          <div className="px-4">
            <Link
              href={`${base}/products/new`}
              aria-current={creating ? "page" : undefined}
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-night-foreground text-[13.5px] font-medium text-night outline-none transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_10px_24px_-10px_color-mix(in_oklab,var(--ember)_70%,transparent)] focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-night motion-reduce:transition-none"
            >
              <Plus className="size-4" aria-hidden="true" /> New product
            </Link>
          </div>

          <nav aria-label="Admin" className="mt-6 px-3">
            <ul className="grid gap-0.5">
              {links.map(({ href, label, icon: Icon, active }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-11 items-center gap-3 rounded-lg px-3 text-[14px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ember motion-reduce:transition-none",
                      active ? "bg-night-raised text-night-foreground" : "text-night-muted hover:bg-night-raised/60 hover:text-night-foreground",
                    )}
                  >
                    {/* The lit section: a small lamp-light bar, like a switched-on pendant. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-ember transition-opacity duration-300 motion-reduce:transition-none",
                        active ? "opacity-100 shadow-[0_0_12px_2px_color-mix(in_oklab,var(--ember)_55%,transparent)]" : "opacity-0",
                      )}
                    />
                    <Icon className={cn("size-[18px]", active ? "text-ember" : "text-night-muted group-hover:text-night-foreground")} aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto grid gap-4 border-t border-night-line px-6 py-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-sm text-[13px] font-medium text-night-muted outline-none transition-colors hover:text-night-foreground focus-visible:ring-2 focus-visible:ring-ember motion-reduce:transition-none"
            >
              View store <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
            {account}
          </div>
        </aside>
      </div>

      {/* Phones and tablets: a compact bar, with the sections as tabs underneath. */}
      <header className="sticky top-0 z-30 bg-night text-night-foreground lg:hidden">
        <div className="flex h-14 items-center gap-3 px-[clamp(1rem,4vw,2rem)]">
          <Link href={base} className="mr-auto flex items-baseline gap-2.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ember">
            <Wordmark className="text-[1.05rem]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-night-muted">{badge}</span>
          </Link>
          <Link
            href="/"
            aria-label="View store"
            className="grid size-9 place-items-center rounded-full text-night-muted outline-none hover:text-night-foreground focus-visible:ring-2 focus-visible:ring-ember"
          >
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href={`${base}/products/new`}
            aria-label="New product"
            className="grid size-9 place-items-center rounded-full bg-night-foreground text-night outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-night"
          >
            <Plus className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <nav aria-label="Admin sections" className="border-t border-night-line">
          <ul className="flex px-[clamp(0.5rem,3vw,1.5rem)]">
            {links.map(({ href, label, active }) => (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-11 items-center justify-center text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ember",
                    active ? "text-night-foreground" : "text-night-muted",
                  )}
                >
                  {label}
                  <span aria-hidden="true" className={cn("absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-ember transition-opacity motion-reduce:transition-none", active ? "opacity-100" : "opacity-0")} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="flex min-w-0 flex-col">
        {/* The account corner on small screens, as a slim strip under the bar (the sidebar holds it on large screens). */}
        <div className="bg-night-raised px-[clamp(1rem,4vw,2rem)] py-2.5 text-night-foreground lg:hidden">{account}</div>
        <main id="main" tabIndex={-1} className="flex-1 pb-24 outline-none">
          <div className="mx-auto w-full max-w-[78rem] px-[clamp(1.25rem,4vw,3rem)]">{children}</div>
        </main>
      </div>
    </div>
  );
}
