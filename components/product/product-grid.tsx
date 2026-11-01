import { cn } from "cn";
import type { Product } from "@/lib/catalog/types";
import { ProductCard } from "./product-card";

/* Columns sit edge to edge, so each row's top borders join into one ceiling line that the pendants hang from. */
export function ProductGrid({ products, eagerCount = 0, className }: { products: Product[]; eagerCount?: number; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-y-14", className)}>
      {products.map((product, index) => (
        <li key={product.id} className="border-t border-foreground/15">
          <ProductCard product={product} eager={index < eagerCount} />
        </li>
      ))}
    </ul>
  );
}
