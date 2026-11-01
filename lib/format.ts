const formatters = new Map<string, { whole: Intl.NumberFormat; exact: Intl.NumberFormat; digits: number }>();

function formatterFor(currency: string) {
  let entry = formatters.get(currency);
  if (!entry) {
    const exact = new Intl.NumberFormat("en-US", { style: "currency", currency });
    const digits = exact.resolvedOptions().maximumFractionDigits ?? 2;
    entry = { exact, digits, whole: new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }) };
    formatters.set(currency, entry);
  }
  return entry;
}

/**
 * Formats an amount in minor units: 18000 → "$180", 18050 → "$180.50". Whole amounts drop the decimals.
 * A fixed locale keeps server and client output identical.
 */
export function formatPrice(amountMinor: number, currency = "USD"): string {
  const { whole, exact, digits } = formatterFor(currency);
  const factor = 10 ** digits;
  return amountMinor % factor === 0 ? whole.format(amountMinor / factor) : exact.format(amountMinor / factor);
}

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

/** 8 → "Eight"; larger numbers stay as digits. */
export function countWord(count: number): string {
  return WORDS[count] ?? String(count);
}
