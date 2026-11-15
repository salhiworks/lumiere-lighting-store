import Link from "next/link";
import { Button } from "@/components/ui/button";

/* The store's "nothing at this address" message, shared by the 404 page and the public demo's local-product page. */
export function NotFoundContent() {
  return (
    <div className="shell flex flex-col items-center py-32 text-center">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-light tracking-[-0.02em]">Nothing at this address</h1>
      <p className="mt-3 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">The link may be mistyped, or the page or pendant has been removed. Every current pendant is in the shop.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/shop">Shop all pendants</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to the homepage</Link>
        </Button>
      </div>
    </div>
  );
}
