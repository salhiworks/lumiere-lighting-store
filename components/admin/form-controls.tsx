import * as React from "react";
import { cn } from "cn";

/* Small form building blocks for the admin: a labelled control with an optional hint and an error wired to aria-describedby. */

export const controlClass =
  "w-full rounded-md border border-input bg-card px-3.5 text-[15px] text-foreground shadow-[inset_0_1px_1px_rgb(35_32_28/0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 aria-invalid:border-destructive aria-invalid:ring-destructive/15 disabled:opacity-60 motion-reduce:transition-none";

type FieldProps = {
  id: string;
  label: string;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: (control: { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined }) => React.ReactNode;
};

export function Field({ id, label, hint, error, className, children }: FieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-foreground">
        {label}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[12.5px] leading-snug text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-[12.5px] leading-snug text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-foreground/15 pt-6">
      <h2 className="font-display text-[1.45rem] font-normal leading-tight tracking-[-0.01em]">{title}</h2>
      {description && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}
