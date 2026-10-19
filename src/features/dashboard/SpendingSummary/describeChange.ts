export type Change =
  | { kind: 'none' } // nothing to compare against
  | { kind: 'same' } // rounds to 0%
  | { kind: 'up' | 'down'; percent: number };

/** Describes a percentage change from the API, rounded to a whole percent for display. */
export function describeChange(changePercent: number | null): Change {
  if (changePercent === null) return { kind: 'none' };

  const percent = Math.round(Math.abs(changePercent));
  if (percent === 0) return { kind: 'same' };
  return { kind: changePercent > 0 ? 'up' : 'down', percent };
}
