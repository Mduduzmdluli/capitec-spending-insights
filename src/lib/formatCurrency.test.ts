import { describe, expect, it } from 'vitest';
import { formatCurrency, formatShare } from './formatCurrency';

// Intl uses non-breaking spaces; normalise them so assertions stay readable
const normalise = (value: string) => value.replace(/\s/g, ' ');

describe('formatCurrency', () => {
  it('formats cents as rand with two decimal places', () => {
    expect(normalise(formatCurrency(123456))).toBe('R 1 234,56');
  });

  it('formats zero', () => {
    expect(normalise(formatCurrency(0))).toBe('R 0,00');
  });

  it('formats amounts under one rand', () => {
    expect(normalise(formatCurrency(5))).toBe('R 0,05');
  });
});

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
