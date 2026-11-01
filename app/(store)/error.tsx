"use client";

import { ErrorState } from "@/components/layout/error-state";

export default function StoreError({ retry }: { error: unknown; retry: () => void }) {
  return <ErrorState retry={retry} />;
}
