import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminProductNotFound() {
  return (
    <main id="main" className="shell flex flex-1 flex-col items-center py-28 text-center">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-3 font-display text-[clamp(2rem,4vw,2.6rem)] font-light tracking-[-0.02em]">No product with this ID</h1>
      <p className="mt-3 max-w-[44ch] text-sm text-muted-foreground">It may have been removed in Supabase. Every product is listed on the products page.</p>
      <Button asChild className="mt-8">
        <Link href="/admin">All products</Link>
      </Button>
    </main>
  );
}
