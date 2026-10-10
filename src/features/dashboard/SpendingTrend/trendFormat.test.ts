import { describe, expect, it } from 'vitest';
import { formatPeriodLong, formatTick, summariseTrend } from './trendFormat';

describe('formatTick', () => {
  it('shows day and month for daily and weekly charts', () => {
    expect(formatTick('2026-10-08', 'day')).toBe('8 Oct');
    expect(formatTick('2026-10-05', 'week')).toBe('5 Oct');
  });

  it('shows just the month for monthly charts', () => {
    expect(formatTick('2026-10-01', 'month')).toBe('Oct');
  });
});

describe('formatPeriodLong', () => {
  it('describes each interval in full', () => {
    expect(formatPeriodLong('2026-10-08', 'day')).toBe('Thu 8 Oct 2026');
    expect(formatPeriodLong('2026-10-05', 'week')).toBe('Week of 5 Oct 2026');
    expect(formatPeriodLong('2026-10-01', 'month')).toBe('October 2026');
  });
});

describe('summariseTrend', () => {
  it('finds the average and the highest period', () => {
    const summary = summariseTrend([
      { periodStart: '2026-10-06', totalCents: 10000 },
      { periodStart: '2026-10-07', totalCents: 0 },
      { periodStart: '2026-10-08', totalCents: 50000 },
    ]);

    expect(summary).toEqual({
      total: 60000,
      average: 20000,
      peak: { periodStart: '2026-10-08', totalCents: 50000 },
    });
  });

  it('has no peak when nothing was spent', () => {
    expect(summariseTrend([{ periodStart: '2026-10-06', totalCents: 0 }]).peak).toBeNull();
  });

  it('handles an empty list', () => {
    expect(summariseTrend([])).toEqual({ total: 0, average: 0, peak: null });
  });
});
