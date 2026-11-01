/* Loading state for the shop: the toolbar and the grid's ceiling rules, with soft placeholders where the pendants will hang. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-hidden="true">
      <div className="flex flex-wrap gap-2 py-6">
        {[56, 140, 72, 120].map((width) => (
          <span key={width} className="h-9 animate-pulse rounded-full bg-secondary" style={{ width }} />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-y-14">
        {Array.from({ length: count }, (_, index) => (
          <li key={index} className="border-t border-foreground/15 px-3 pb-2 sm:px-5">
            <span className="relative block aspect-[4/5]">
              <span className="ceiling-canopy absolute left-1/2 top-0 -translate-x-1/2" />
              <span className="absolute left-1/2 top-0 h-[38%] w-px -translate-x-1/2 bg-foreground/15" />
              <span className="absolute left-1/2 top-[38%] h-[30%] w-[62%] -translate-x-1/2 animate-pulse rounded-t-full bg-secondary" />
            </span>
            <span className="mt-4 block h-5 w-2/3 animate-pulse rounded bg-secondary" />
            <span className="mt-2 block h-3.5 w-1/3 animate-pulse rounded bg-secondary" />
          </li>
        ))}
      </ul>
    </div>
  );
}
