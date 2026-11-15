"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { demoStore } from "@/lib/demo-admin/store";
import { useDemoEdits } from "@/lib/demo-admin/use-demo-catalog";

/*
 * The Demo Admin Dashboard's account corner: where the real admin has Sign out, the demo has Reset Demo. It forgets every edit and
 * every product the visitor created, in this browser; the cart is the visitor's own and stays.
 */
export function DemoResetControl() {
  const edits = useDemoEdits();
  const [message, setMessage] = React.useState("");
  const changes = Object.keys(edits.products).length + Object.keys(edits.orders).length + Object.keys(edits.created).length;
  React.useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);
  const reset = () => {
    const created = Object.keys(edits.created).length;
    if (created > 0 && !window.confirm(`Reset the demo? This deletes the ${created === 1 ? "product" : `${created} products`} you created and undoes every edit, in this browser.`)) return;
    demoStore.reset();
    setMessage("Demo reset. The sample pendants and orders are back as they were.");
  };
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12.5px] text-night-muted">{changes ? `${changes} ${changes === 1 ? "change" : "changes"} in this browser` : "Sample data, unchanged"}</span>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-night-line px-3 text-[12.5px] font-medium text-night-foreground outline-none transition-colors hover:border-night-muted focus-visible:ring-2 focus-visible:ring-ember motion-reduce:transition-none"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" /> Reset Demo
        </button>
      </div>
      <p role="status" aria-live="polite" className={message ? "text-[12px] text-ember" : "sr-only"}>
        {message}
      </p>
    </div>
  );
}
