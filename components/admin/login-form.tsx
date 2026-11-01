"use client";

import * as React from "react";
import { cn } from "cn";
import { signIn, type SignInState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { controlClass, Field } from "./form-controls";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = React.useActionState<SignInState, FormData>(signIn, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[2.4rem] font-light leading-none tracking-[-0.02em]">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">For store administrators. Visitors don’t need an account.</p>
      </div>
      <Field id="email" label="Email">
        {(control) => <input {...control} name="email" type="email" autoComplete="username" required defaultValue={state.email} className={cn(controlClass, "h-11")} />}
      </Field>
      <Field id="password" label="Password">
        {(control) => <input {...control} name="password" type="password" autoComplete="current-password" required className={cn(controlClass, "h-11")} />}
      </Field>
      <input type="hidden" name="next" value={next ?? ""} />
      <p role="alert" aria-live="assertive" className={state.error ? "rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive" : "sr-only"}>
        {state.error ?? ""}
      </p>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
