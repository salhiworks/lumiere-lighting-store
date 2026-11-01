"use client";

import * as React from "react";
import { setProductVisibility, type VisibilityState } from "@/app/admin/actions";

/* Publishes or hides one product from the list. The server action re-checks admin rights and updates the store's cache. */
export function VisibilityButton({ productId, published, title }: { productId: string; published: boolean; title: string }) {
  const [state, action, pending] = React.useActionState<VisibilityState, FormData>(setProductVisibility, {});
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="published" value={String(!published)} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`${published ? "Hide" : "Publish"} ${title}`}
        className="h-8 rounded-full border border-foreground/20 px-3 text-[12.5px] font-medium outline-none transition-colors hover:border-foreground/45 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 motion-reduce:transition-none"
      >
        {pending ? "Saving…" : published ? "Hide" : "Publish"}
      </button>
      {state.error && (
        <span role="alert" className="text-[12px] text-destructive">
          {state.error}
        </span>
      )}
    </form>
  );
}
