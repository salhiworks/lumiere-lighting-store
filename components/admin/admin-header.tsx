import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { signOut } from "@/app/admin/actions";
import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";
import { AdminNav } from "./admin-nav";

export function AdminHeader({ email }: { email?: string | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="shell flex h-16 items-center gap-3">
        <Link href="/admin" className="flex items-baseline gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Wordmark className="text-[1.15rem]" />
          <span className="eyebrow">Admin</span>
        </Link>
        <div className="mr-auto ml-4">{email && <AdminNav />}</div>
        <Link
          href="/"
          className="hidden h-9 items-center gap-1 rounded-full px-3 text-[13px] font-medium text-foreground/75 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
        >
          View store <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
        {email && (
          <>
            <span className="hidden max-w-[22ch] truncate text-[13px] text-muted-foreground md:inline" title={email}>
              {email}
            </span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </>
        )}
      </div>
    </header>
  );
}
