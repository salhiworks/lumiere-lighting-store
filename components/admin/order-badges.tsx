import { cn } from "cn";
import { FULFILLMENT_LABELS, PAYMENT_LABELS, type FulfillmentStatus, type PaymentStatus } from "@/lib/admin/order-format";

/* Payment state reads at a glance: a lit brass dot means money has arrived; outlines mean it hasn't (yet). */
const PAYMENT_TONE: Record<PaymentStatus, string> = {
  paid: "bg-brass shadow-[0_0_8px_var(--glow)]",
  needs_review: "bg-destructive",
  processing: "border border-brass",
  pending: "border border-foreground/40",
  failed: "border border-destructive/60",
  expired: "border border-foreground/25",
  canceled: "border border-foreground/25",
};

export function PaymentBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 whitespace-nowrap text-[13px]", status === "needs_review" && "font-medium text-destructive", className)}>
      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", PAYMENT_TONE[status])} />
      {PAYMENT_LABELS[status]}
    </span>
  );
}

export function FulfillmentBadge({ status, payment }: { status: FulfillmentStatus; payment: PaymentStatus }) {
  if (payment !== "paid") return <span className="text-[13px] text-muted-foreground">—</span>;
  return (
    <span className={cn("whitespace-nowrap text-[13px]", status === "unfulfilled" ? "font-medium" : "text-muted-foreground")}>
      {status === "unfulfilled" ? "To ship" : FULFILLMENT_LABELS[status]}
    </span>
  );
}
