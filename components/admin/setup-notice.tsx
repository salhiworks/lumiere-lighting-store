/* Shown at /admin in demo mode: the store runs on the built-in catalog until a Supabase project is connected. */
export function SetupNotice({ problem }: { problem?: string }) {
  const steps = [
    <>Create a Supabase project.</>,
    <>
      In its SQL editor, run the two files in <code>supabase/migrations/</code> in order, then <code>supabase/seed.sql</code>.
    </>,
    <>
      Copy <code>.env.example</code> to <code>.env.local</code> and fill in <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
      <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>.
    </>,
    <>
      Create your administrator: add a user under Authentication → Users, then add it to <code>admin_users</code> (docs/ADMIN.md, “Create your
      administrator”).
    </>,
    <>Restart the server and sign in here.</>,
  ];
  return (
    <div className="mx-auto max-w-2xl py-16 sm:py-24">
      <p className="eyebrow">{problem ? "Configuration problem" : "Demo catalog"}</p>
      <h1 className="mt-3 font-display text-[clamp(2rem,4vw,2.8rem)] font-light leading-tight tracking-[-0.02em]">
        {problem ? "Supabase isn’t set up correctly" : "Connect Supabase to manage products"}
      </h1>
      {problem ? (
        <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm leading-relaxed text-destructive">
          {problem}
        </p>
      ) : (
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          The store is running on its built-in demo catalog. Connect a Supabase project to edit products, prices, stock and photos here.
        </p>
      )}
      <ol className="mt-10 space-y-4 border-t border-foreground/15 pt-6 text-[15px] leading-relaxed [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]">
        {steps.map((step, index) => (
          <li key={index} className="grid grid-cols-[2rem_1fr] gap-2">
            <span className="font-mono text-[13px] leading-[1.7] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-sm text-muted-foreground">The full walkthrough is in the README, under “Connect Supabase”.</p>
    </div>
  );
}
