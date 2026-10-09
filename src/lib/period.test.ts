import { describe, expect, it } from 'vitest';
import { formatDateRange, getDateRange, getPeriodInterval, isPeriod } from './period';

const today = new Date(2026, 9, 8); // 8 October 2026

describe('getDateRange', () => {
  it.each([
    ['7d', '2026-10-02'],
    ['30d', '2026-09-09'],
    ['90d', '2026-07-11'],
  ] as const)('covers the right number of days for %s, including today', (period, from) => {
    expect(getDateRange(period, today)).toEqual({ from, to: '2026-10-08' });
  });

  it('covers 12 whole calendar months for 12m', () => {
    expect(getDateRange('12m', today)).toEqual({ from: '2025-11-01', to: '2026-10-08' });
  });
});

describe('isPeriod', () => {
  it('accepts known periods', () => {
    expect(isPeriod('90d')).toBe(true);
  });

  it('rejects unknown or missing values', () => {
    expect(isPeriod('forever')).toBe(false);
    expect(isPeriod(null)).toBe(false);
  });
});

describe('getPeriodInterval', () => {
  it('groups longer periods into larger intervals', () => {
    expect(getPeriodInterval('7d')).toBe('day');
    expect(getPeriodInterval('90d')).toBe('week');
    expect(getPeriodInterval('12m')).toBe('month');
  });
});

describe('formatDateRange', () => {
  it('shows the year once when both dates share it', () => {
    expect(formatDateRange({ from: '2026-09-09', to: '2026-10-08' })).toBe('9 Sep – 8 Oct 2026');
  });

  it('shows both years when the range crosses a year', () => {
    expect(formatDateRange({ from: '2025-11-01', to: '2026-10-08' })).toBe(
      '1 Nov 2025 – 8 Oct 2026',
    );
  });
});
