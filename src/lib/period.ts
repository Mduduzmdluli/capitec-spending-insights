import { format, parseISO, startOfMonth, subDays, subMonths } from 'date-fns';
import type { DateRange, TrendInterval } from '../api/schemas';

export const PERIODS = [
  { id: '7d', label: '7 days', interval: 'day' },
  { id: '30d', label: '30 days', interval: 'day' },
  { id: '90d', label: '90 days', interval: 'week' },
  { id: '12m', label: '12 months', interval: 'month' },
] as const satisfies readonly { id: string; label: string; interval: TrendInterval }[];

export type Period = (typeof PERIODS)[number]['id'];

export const DEFAULT_PERIOD: Period = '30d';

export function isPeriod(value: string | null): value is Period {
  return PERIODS.some((period) => period.id === value);
}

export function getPeriodInterval(period: Period): TrendInterval {
  return PERIODS.find((p) => p.id === period)?.interval ?? 'day';
}

const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

/** The date range a period covers, ending today. */
export function getDateRange(period: Period, today: Date = new Date()): DateRange {
  const to = toDateKey(today);
  switch (period) {
    case '7d':
      return { from: toDateKey(subDays(today, 6)), to };
    case '30d':
      return { from: toDateKey(subDays(today, 29)), to };
    case '90d':
      return { from: toDateKey(subDays(today, 89)), to };
    case '12m':
      // Whole calendar months, so the monthly chart has no partial first month
      return { from: toDateKey(startOfMonth(subMonths(today, 11))), to };
  }
}

/** For example "9 Sep – 8 Oct 2026", or "1 Nov 2025 – 8 Oct 2026" across years. */
export function formatDateRange({ from, to }: DateRange): string {
  const start = parseISO(from);
  const end = parseISO(to);
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${format(start, sameYear ? 'd MMM' : 'd MMM yyyy')} – ${format(end, 'd MMM yyyy')}`;
}
