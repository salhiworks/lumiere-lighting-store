"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "cn";

type QuantityStepperProps = {
  value: number;
  max: number;
  min?: number;
  onChange: (value: number) => void;
  /** Names the group for screen readers, e.g. "Quantity, Enamel dome · Forest". */
  label: string;
  className?: string;
};

export function QuantityStepper({ value, max, min = 1, onChange, label, className }: QuantityStepperProps) {
  const step = "grid size-9 place-items-center rounded-full text-foreground outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none";
  return (
    <div role="group" aria-label={label} className={cn("inline-flex h-10 items-center rounded-full border border-foreground/20 px-0.5", className)}>
      <button type="button" className={step} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Minus className="size-3.5" aria-hidden="true" />
      </button>
      <output className="min-w-7 text-center text-sm tabular-nums">{value}</output>
      <button type="button" className={step} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
