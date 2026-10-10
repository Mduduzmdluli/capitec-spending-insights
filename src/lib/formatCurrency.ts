const zarFormatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
});

/** Formats an amount in cents as South African rand, e.g. 123456 -> "R 1 234,56". */
export function formatCurrency(cents: number): string {
  return zarFormatter.format(cents / 100);
}

const compactFormatter = new Intl.NumberFormat('en-ZA', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Short form for chart axes, e.g. 1250000 cents -> "R 12,5 k". */
export function formatCompactRand(cents: number): string {
  return `R ${compactFormatter.format(cents / 100)}`;
}

const wholeNumber = new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 });

/** A share of a total as a whole percent. Tiny but non-zero shares show as "<1%", not "0%". */
export function formatShare(percentage: number): string {
  if (percentage > 0 && percentage < 1) return '<1%';
  return `${wholeNumber.format(percentage)}%`;
}
