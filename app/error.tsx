"use client";

import { ErrorState } from "@/components/layout/error-state";

/* Catches failures in the storefront frame itself (for example, the catalog could not be loaded for the header and cart). */
export default function RootError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main id="main" className="flex-1">
      <ErrorState retry={retry} title="The store didn’t load" />
    </main>
  );
}
