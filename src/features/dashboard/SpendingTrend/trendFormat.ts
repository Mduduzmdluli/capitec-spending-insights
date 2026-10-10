import { format, parseISO } from 'date-fns';
import type { SpendingTrends, TrendInterval } from '../../../api/schemas';

export type TrendPoint = SpendingTrends['points'][number];

export const INTERVAL_TEXT: Record<TrendInterval, { description: string; noun: string }> = {
  day: { description: 'Daily totals', noun: 'day' },
  week: { description: 'Weekly totals', noun: 'week' },
  month: { description: 'Monthly totals', noun: 'month' },
};

/** Short label for the chart's x-axis. */
export function formatTick(periodStart: string, interval: TrendInterval): string {
  const date = parseISO(periodStart);
  return interval === 'month' ? format(date, 'MMM') : format(date, 'd MMM');
}

/** Full label for tooltips, the data table and the highest-period stat. */
export function formatPeriodLong(periodStart: string, interval: TrendInterval): string {
  const date = parseISO(periodStart);
  switch (interval) {
    case 'day':
      return format(date, 'EEE d MMM yyyy');
    case 'week':
      return `Week of ${format(date, 'd MMM yyyy')}`;
    case 'month':
      return format(date, 'MMMM yyyy');
  }
}

/** The average across all periods and the single highest period (null if nothing was spent). */
export function summariseTrend(points: TrendPoint[]) {
  const total = points.reduce((sum, point) => sum + point.totalCents, 0);
  const peak = points.reduce<TrendPoint | null>(
    (highest, point) => (point.totalCents > (highest?.totalCents ?? 0) ? point : highest),
    null,
  );

  return {
    total,
    average: points.length > 0 ? Math.round(total / points.length) : 0,
    peak,
  };
}
