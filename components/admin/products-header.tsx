import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/* The products page's heading, shared with the public demo dashboard: the counts, and the prominent Add product action. */
export function ProductsHeader({ visible, hidden, low, newHref, note }: { visible: number; hidden: number; low: number; newHref: string; note?: React.ReactNode }) {
  return (
    <>
    <div className="flex flex-wrap items-end justify-between gap-6 pt-8 sm:pt-12">
      <div>
        <p className="eyebrow">Catalog</p>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,4.4vw,3.4rem)] font-light leading-none tracking-[-0.03em]">Products</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {visible} visible in the store · {hidden} hidden{low > 0 && ` · ${low} low on stock or sold out`}
        </p>
      </div>
      <Button asChild size="lg">
        <Link href={newHref}>
          <Plus aria-hidden="true" /> Add product
        </Link>
      </Button>
    </div>
    {note}
    </>
  );
}
