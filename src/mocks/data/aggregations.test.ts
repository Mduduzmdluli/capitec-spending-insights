import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../api/schemas';
import {
  computeCategoryBreakdown,
  computeSummary,
  computeTrends,
  previousRange,
  queryTransactions,
} from './aggregations';

let nextId = 1;
const tx = (
  overrides: Partial<Transaction> & Pick<Transaction, 'date' | 'amountCents'>,
): Transaction => ({
  id: `t${nextId++}`,
  merchant: 'Checkers',
  category: 'groceries',
  type: 'debit',
  channel: 'card',
  ...overrides,
});

// Midday UTC so the calendar day is the same in any timezone near South Africa
const transactions: Transaction[] = [
  tx({ date: '2026-02-25T10:00:00.000Z', amountCents: 15000 }),
  tx({ date: '2026-03-01T10:00:00.000Z', amountCents: 10000 }),
  tx({
    date: '2026-03-02T10:00:00.000Z',
    amountCents: 5000,
    merchant: "Nando's",
    category: 'dining',
  }),
  tx({ date: '2026-03-08T10:00:00.000Z', amountCents: 20000, merchant: 'Woolworths Food' }),
  tx({
    date: '2026-03-25T10:00:00.000Z',
    amountCents: 3250000,
    merchant: 'Salary',
    category: 'income',
    type: 'credit',
    channel: 'eft',
  }),
  tx({ date: '2026-04-01T10:00:00.000Z', amountCents: 999 }),
];

const march = { from: '2026-03-01', to: '2026-03-31' };

describe('previousRange', () => {
  it('returns the period of equal length immediately before', () => {
    expect(previousRange(march)).toEqual({ from: '2026-01-29', to: '2026-02-28' });
  });
});

describe('computeSummary', () => {
  it('totals spending only, excluding income and out-of-range transactions', () => {
    expect(computeSummary(transactions, march)).toEqual({
      from: '2026-03-01',
      to: '2026-03-31',
      totalSpentCents: 35000,
      previousPeriodSpentCents: 15000,
      transactionCount: 3,
      averageTransactionCents: 11667,
      topCategory: 'groceries',
    });
  });

  it('handles a period with no spending', () => {
    const summary = computeSummary(transactions, { from: '2026-06-01', to: '2026-06-30' });
    expect(summary.totalSpentCents).toBe(0);
    expect(summary.averageTransactionCents).toBe(0);
    expect(summary.topCategory).toBeNull();
  });
});

describe('computeTrends', () => {
  it('fills days without spending with zero', () => {
    const { points } = computeTrends(transactions, { from: '2026-03-01', to: '2026-03-03' }, 'day');
    expect(points).toEqual([
      { periodStart: '2026-03-01', totalCents: 10000 },
      { periodStart: '2026-03-02', totalCents: 5000 },
      { periodStart: '2026-03-03', totalCents: 0 },
    ]);
  });

  it('groups by weeks starting on Monday', () => {
    // 1 March 2026 is a Sunday, so it belongs to the week starting 23 February
    const { points } = computeTrends(
      transactions,
      { from: '2026-03-01', to: '2026-03-14' },
      'week',
    );
    expect(points).toEqual([
      { periodStart: '2026-02-23', totalCents: 10000 },
      { periodStart: '2026-03-02', totalCents: 25000 },
      { periodStart: '2026-03-09', totalCents: 0 },
    ]);
  });
});

describe('computeCategoryBreakdown', () => {
  it('returns categories sorted by spend with percentages', () => {
    expect(computeCategoryBreakdown(transactions, march).categories).toEqual([
      { category: 'groceries', totalCents: 30000, transactionCount: 2, percentage: 85.7 },
      { category: 'dining', totalCents: 5000, transactionCount: 1, percentage: 14.3 },
    ]);
  });
});

describe('queryTransactions', () => {
  const defaults = { ...march, page: 1, pageSize: 20, sort: 'date_desc' as const };

  it('searches merchants case-insensitively', () => {
    const result = queryTransactions(transactions, { ...defaults, q: 'NANDO' });
    expect(result.items.map((t) => t.merchant)).toEqual(["Nando's"]);
  });

  it('filters by category', () => {
    const result = queryTransactions(transactions, { ...defaults, category: 'groceries' });
    expect(result.totalItems).toBe(2);
  });

  it('paginates and clamps out-of-range pages', () => {
    const result = queryTransactions(transactions, { ...defaults, pageSize: 2, page: 99 });
    expect(result).toMatchObject({ page: 2, totalPages: 2, totalItems: 4 });
    expect(result.items).toHaveLength(2);
  });

  it('sorts by amount', () => {
    const result = queryTransactions(transactions, { ...defaults, sort: 'amount_asc' });
    expect(result.items.map((t) => t.amountCents)).toEqual([5000, 10000, 20000, 3250000]);
  });
});
