import { signOut } from "@/app/admin/actions";
import { StudioShell } from "./studio-shell";

/* The signed-in admin's frame: the studio shell, with the administrator's email and Sign out in its account corner. */
export function AdminFrame({ email, children }: { email: string | null; children: React.ReactNode }) {
  return (
    <StudioShell
      base="/admin"
      badge="Studio"
      account={
        <form action={signOut} className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-[12.5px] text-night-muted" title={email ?? undefined}>
            {email ?? "Administrator"}
          </span>
          <button
            type="submit"
            className="h-8 shrink-0 rounded-full border border-night-line px-3 text-[12.5px] font-medium text-night-foreground outline-none transition-colors hover:border-night-muted focus-visible:ring-2 focus-visible:ring-ember motion-reduce:transition-none"
          >
            Sign out
          </button>
        </form>
      }
    >
      {children}
    </StudioShell>
  );
}
