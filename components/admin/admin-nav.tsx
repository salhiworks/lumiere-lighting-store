"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export type AdminNavLink = { href: string; label: string; active: (path: string) => boolean };

const LINKS: AdminNavLink[] = [
  { href: "/admin", label: "Products", active: (path: string) => path === "/admin" || path.startsWith("/admin/products") },
  { href: "/admin/orders", label: "Orders", active: (path: string) => path.startsWith("/admin/orders") },
];

/* The real admin's two links by default; the public Demo Admin Dashboard passes its own. */
export function AdminNav({ links = LINKS }: { links?: AdminNavLink[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex items-center gap-1">
      {links.map((link) => {
        const active = link.active(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-3 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
              active ? "bg-secondary text-foreground" : "text-foreground/70 hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
