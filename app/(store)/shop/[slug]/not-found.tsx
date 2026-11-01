import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="shell flex flex-col items-center py-28 text-center">
      <svg aria-hidden="true" viewBox="0 0 64 96" className="h-24 w-16 text-muted-foreground/60" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M32 0v38" strokeDasharray="3 4" />
        <path d="M28 38h8l2 6H26z" />
        <path d="M32 44c-12 0-19 9-22 26h44c-3-17-10-26-22-26z" />
      </svg>
      <p className="eyebrow mt-8">Not found</p>
      <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-light tracking-[-0.02em]">No pendant at this address</h1>
      <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
        The link may be mistyped, or the design has left the collection. Every current pendant is in the shop.
      </p>
      <Button asChild className="mt-8">
        <Link href="/shop">Browse all pendants</Link>
      </Button>
    </div>
  );
}
