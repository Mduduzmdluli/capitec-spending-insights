const wholeNumber = new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 });

/** A share of a total as a whole percent. Tiny but non-zero shares show as "<1%", not "0%". */
export function formatShare(percentage: number): string {
  if (percentage > 0 && percentage < 1) return '<1%';
  return `${wholeNumber.format(percentage)}%`;
}
