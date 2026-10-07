import { describe, expect, it } from 'vitest';
import { formatCurrency } from './formatCurrency';

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
