import { describe, expect, it } from 'vitest';
import { formatShare } from './formatPercent.ts';

describe('formatShare', () => {
  it('rounds to a whole percent', () => {
    expect(formatShare(85.7)).toBe('86%');
    expect(formatShare(14.3)).toBe('14%');
  });

  it('shows tiny non-zero shares as less than one percent', () => {
    expect(formatShare(0.4)).toBe('<1%');
  });

  it('handles the extremes', () => {
    expect(formatShare(0)).toBe('0%');
    expect(formatShare(100)).toBe('100%');
  });
});
