export type Change =
  | { kind: 'none' } // nothing to compare against
  | { kind: 'same' } // rounds to 0%
  | { kind: 'up' | 'down'; percent: number };

/** How spending this period compares with the previous one, rounded to a whole percent. */
export function describeChange(currentCents: number, previousCents: number): Change {
  if (previousCents === 0) return { kind: 'none' };

  const ratio = (currentCents - previousCents) / previousCents;
  const percent = Math.round(Math.abs(ratio) * 100);

  if (percent === 0) return { kind: 'same' };
  return { kind: ratio > 0 ? 'up' : 'down', percent };
}
