import { cn } from "cn";
import { getStockStatus } from "@/lib/catalog/helpers";
import type { Product } from "@/lib/catalog/types";

export function StockBadge({ product, className }: { product: Product; className?: string }) {
  const stock = getStockStatus(product);
  return (
    <p className={cn("inline-flex items-center gap-2 text-[13px]", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          stock.tone === "in" && "bg-[oklch(0.62_0.09_150)]",
          stock.tone === "low" && "bg-brass",
          stock.tone === "out" && "bg-muted-foreground",
        )}
      />
      <span className={cn(stock.tone === "low" ? "text-brass-deep" : "text-muted-foreground")}>{stock.label}</span>
    </p>
  );
}
