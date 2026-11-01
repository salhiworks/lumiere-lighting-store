"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { site } from "@/lib/site";

const linkClass =
  "relative inline-flex h-10 items-center rounded-full px-3 text-sm font-medium text-foreground/75 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none";

/* Marks the current section with aria-current and a brass underline. Reads the URL, so it renders inside a Suspense boundary. */
export function NavLinks() {
  const pathname = usePathname();
  return <NavList isCurrent={(href) => href !== "/#studio" && (pathname === href || pathname.startsWith(`${href}/`))} />;
}

/* Server-rendered stand-in while the URL is not known yet (pages with unknown params): the same links, nothing marked. */
export function NavLinksFallback() {
  return <NavList isCurrent={() => false} />;
}

function NavList({ isCurrent }: { isCurrent: (href: string) => boolean }) {
  return (
    <ul className="flex items-center">
      {site.nav.map((item) => {
        const current = isCurrent(item.href);
        return (
          <li key={item.href} className={cn(item.href === "/#studio" && "hidden sm:block")}>
            <Link href={item.href} aria-current={current ? "page" : undefined} className={cn(linkClass, current && "text-foreground")}>
              {item.label}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-3 bottom-1.5 h-px origin-left bg-brass transition-transform duration-300 motion-reduce:transition-none",
                  current ? "scale-x-100" : "scale-x-0",
                )}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
