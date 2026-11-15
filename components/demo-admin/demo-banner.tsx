import { FlaskConical } from "lucide-react";

/* Says plainly what the Demo Admin Dashboard is, on every one of its pages. */
export function DemoBanner({ children }: { children?: React.ReactNode }) {
  return (
    <p role="note" className="mt-5 flex items-start gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-brass-deep" aria-hidden="true" />
      <span>
        {children ?? (
          <>
            <strong className="font-medium text-foreground">Interactive demo.</strong> Everything you change is kept in this browser only, and the storefront follows. No sign-in,
            database, payment or customer data; the orders are made up.
          </>
        )}
      </span>
    </p>
  );
}
