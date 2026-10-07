const zarFormatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
});

/** Formats an amount in cents as South African rand, e.g. 123456 -> "R 1 234,56". */
export function formatCurrency(cents: number): string {
  return zarFormatter.format(cents / 100);
}
