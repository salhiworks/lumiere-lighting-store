"use client";

import { Button } from "@/components/ui/button";

/*
 * Shared body of the error boundaries. Production hides server error details from the browser, so the message stays general;
 * the server log has the cause (for example a CatalogError explaining what to fix in the Supabase setup).
 */
export function ErrorState({ retry, title = "This page didn’t load" }: { retry: () => void; title?: string }) {
  return (
    <div className="shell flex flex-col items-center py-32 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-light tracking-[-0.02em]">{title}</h1>
      <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
        The collection couldn’t be loaded just now. Your cart is saved on this device. Try again in a moment.
      </p>
      <Button className="mt-8" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
