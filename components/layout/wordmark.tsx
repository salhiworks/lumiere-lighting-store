import { cn } from "cn";

/* The LUMIÈRE wordmark: the display serif, set in widely spaced capitals. */
export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("font-display text-[1.3rem] font-normal uppercase leading-none tracking-[0.22em]", className)}>Lumière</span>;
}
