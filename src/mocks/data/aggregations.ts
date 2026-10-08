import {
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';
import type {
  CategoryId,
  DateRange,
  Transaction,
  TransactionSort,
  TrendInterval,
} from '../../api/schemas';

const WEEK_OPTIONS = { weekStartsOn: 1 } as const; // Weeks start on Monday

const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd');
const isSpending = (t: Transaction) => t.type === 'debit';
const sumCents = (transactions: Transaction[]) =>
  transactions.reduce((total, t) => total + t.amountCents, 0);

export function filterByRange(transactions: Transaction[], range: DateRange): Transaction[] {
  return transactions.filter((t) => {
    const day = toDateKey(parseISO(t.date));
    return day >= range.from && day <= range.to;
  });
}

/** The period of equal length immediately before `range`, for comparisons. */
export function previousRange(range: DateRange): DateRange {
  const from = parseISO(range.from);
  const length = differenceInCalendarDays(parseISO(range.to), from) + 1;
  return { from: toDateKey(subDays(from, length)), to: toDateKey(subDays(from, 1)) };
}

function totalsByCategory(transactions: Transaction[]) {
  const totals = new Map<CategoryId, { totalCents: number; transactionCount: number }>();
  for (const t of transactions) {
    const current = totals.get(t.category) ?? { totalCents: 0, transactionCount: 0 };
    totals.set(t.category, {
      totalCents: current.totalCents + t.amountCents,
      transactionCount: current.transactionCount + 1,
    });
  }
  return totals;
}

export function computeSummary(transactions: Transaction[], range: DateRange) {
  const spending = filterByRange(transactions, range).filter(isSpending);
  const previous = filterByRange(transactions, previousRange(range)).filter(isSpending);
  const totalSpentCents = sumCents(spending);
  const ranked = [...totalsByCategory(spending)].sort(
    ([, a], [, b]) => b.totalCents - a.totalCents,
  );

  return {
    from: range.from,
    to: range.to,
    totalSpentCents,
    previousPeriodSpentCents: sumCents(previous),
    transactionCount: spending.length,
    averageTransactionCents:
      spending.length > 0 ? Math.round(totalSpentCents / spending.length) : 0,
    topCategory: ranked.length > 0 ? ranked[0][0] : null,
  };
}

const bucketStart: Record<TrendInterval, (date: Date) => Date> = {
  day: (date) => startOfDay(date),
  week: (date) => startOfWeek(date, WEEK_OPTIONS),
  month: (date) => startOfMonth(date),
};

function periodsIn(range: DateRange, interval: TrendInterval): Date[] {
  const span = { start: parseISO(range.from), end: parseISO(range.to) };
  switch (interval) {
    case 'day':
      return eachDayOfInterval(span);
    case 'week':
      return eachWeekOfInterval(span, WEEK_OPTIONS);
    case 'month':
      return eachMonthOfInterval(span);
  }
}

/** Spending per period, with empty periods filled in as zero so charts have no gaps. */
export function computeTrends(
  transactions: Transaction[],
  range: DateRange,
  interval: TrendInterval,
) {
  const totals = new Map(periodsIn(range, interval).map((period) => [toDateKey(period), 0]));

  for (const t of filterByRange(transactions, range).filter(isSpending)) {
    const key = toDateKey(bucketStart[interval](parseISO(t.date)));
    totals.set(key, (totals.get(key) ?? 0) + t.amountCents);
  }

  return {
    interval,
    points: [...totals].map(([periodStart, totalCents]) => ({ periodStart, totalCents })),
  };
}

export function computeCategoryBreakdown(transactions: Transaction[], range: DateRange) {
  const spending = filterByRange(transactions, range).filter(isSpending);
  const total = sumCents(spending);

  return {
    categories: [...totalsByCategory(spending)]
      .map(([category, { totalCents, transactionCount }]) => ({
        category,
        totalCents,
        transactionCount,
        percentage: total > 0 ? Math.round((totalCents / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.totalCents - a.totalCents),
  };
}

export type TransactionFilters = DateRange & {
  category?: CategoryId;
  q?: string;
  page: number;
  pageSize: number;
  sort: TransactionSort;
};

const comparators: Record<TransactionSort, (a: Transaction, b: Transaction) => number> = {
  date_desc: (a, b) => b.date.localeCompare(a.date),
  date_asc: (a, b) => a.date.localeCompare(b.date),
  amount_desc: (a, b) => b.amountCents - a.amountCents,
  amount_asc: (a, b) => a.amountCents - b.amountCents,
};

export function queryTransactions(transactions: Transaction[], filters: TransactionFilters) {
  const search = filters.q?.trim().toLowerCase();

  const matches = filterByRange(transactions, filters)
    .filter((t) => !filters.category || t.category === filters.category)
    .filter((t) => !search || t.merchant.toLowerCase().includes(search))
    .sort(comparators[filters.sort]);

  const totalItems = matches.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * filters.pageSize;

  return {
    items: matches.slice(start, start + filters.pageSize),
    page,
    pageSize: filters.pageSize,
    totalItems,
    totalPages,
  };
}
