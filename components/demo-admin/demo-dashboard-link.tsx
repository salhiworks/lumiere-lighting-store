import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { cn } from "cn";

/* "View Demo Dashboard": the storefront's way into /demo/admin. Rendered only in the public demo build. */
export function DemoDashboardLink({ className }: { className?: string }) {
  return (
    <Link
      href="/demo/admin"
      className={cn(
        "h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-brass/60 bg-brass/10 px-3.5 text-[13px] font-medium text-foreground outline-none transition-colors hover:bg-brass/20 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
        className ?? "inline-flex",
      )}
    >
      <LayoutDashboard className="size-3.5" aria-hidden="true" />
      View Demo Dashboard
    </Link>
  );
}
