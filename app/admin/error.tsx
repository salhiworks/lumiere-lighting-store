"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/* Production hides server error details, so this lists what usually goes wrong; the server log has the exact cause. */
export default function AdminError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main id="main" className="shell flex flex-1 flex-col items-center py-28 text-center">
      <p className="eyebrow">Admin unavailable</p>
      <h1 className="mt-3 font-display text-[clamp(2rem,4vw,2.6rem)] font-light tracking-[-0.02em]">The admin couldn’t reach Supabase</h1>
      <ul className="mt-5 max-w-[52ch] space-y-1.5 text-left text-sm leading-relaxed text-muted-foreground">
        <li>· Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.</li>
        <li>· Make sure the migration and seed have been run in the project’s SQL editor.</li>
        <li>· Paused free projects need to be restored in the Supabase dashboard.</li>
      </ul>
      <div className="mt-8 flex gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Back to the store</Link>
        </Button>
      </div>
    </main>
  );
}
