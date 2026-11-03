import { FlaskConical } from "lucide-react";

/* Says plainly what the Demo Admin Dashboard is, on every one of its pages. */
export function DemoBanner() {
  return (
    <p role="note" className="mt-6 flex items-start gap-3 rounded-lg border border-brass/40 bg-brass/10 px-4 py-3 text-[13.5px] leading-relaxed">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-brass-deep" aria-hidden="true" />
      <span>
        <strong className="font-medium">Interactive demo.</strong> Edit the sample pendants and open the storefront to see the changes. Everything is kept in this
        browser only. There is no sign-in, database, payment or customer data, and the orders are made up.
      </span>
    </p>
  );
}
