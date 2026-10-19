import { describe, expect, it } from 'vitest';
import {
  toCategoryBreakdown,
  toCents,
  toChannel,
  toCustomer,
  toGoals,
  toSpendingSummary,
  toSpendingTrends,
  toTransactionPage,
  toTransactionsParams,
} from './adapters';
import { InvalidResponseError } from './client';

describe('toCents', () => {
  it('converts rand to exact whole cents, despite floating-point error', () => {
    // Why rounding is needed: many everyday amounts aren't exact in floating point
    expect(0.29 * 100).not.toBe(29);
    expect(1.15 * 100).not.toBe(115);

    expect(toCents(0.29)).toBe(29);
    expect(toCents(1.15)).toBe(115);
    expect(toCents(245.8)).toBe(24580);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(0)).toBe(0);
  });
});

describe('toCustomer', () => {
  it('maps the profile into the app model', () => {
    expect(
      toCustomer({
        customerId: '12345',
        name: 'Mduduzi Mdluli',
        email: 'mduduzmdluli@gmail.com',
        joinDate: '2023-01-15',
        accountType: 'premium',
        totalSpent: 15420.5,
        currency: 'ZAR',
      }),
    ).toEqual({
      id: '12345',
      name: 'Mduduzi Mdluli',
      email: 'mduduzmdluli@gmail.com',
      joinDate: '2023-01-15',
      accountType: 'premium',
      totalSpentCents: 1542050,
      currency: 'ZAR',
    });
  });
});

describe('toSpendingSummary', () => {
  const summary = {
    period: '30d' as const,
    totalSpent: 4250.75,
    transactionCount: 47,
    averageTransaction: 90.44,
    topCategory: 'Groceries',
    comparedToPrevious: { spentChange: 12.5, transactionChange: -3.2 },
  };

  it('maps the documented example', () => {
    expect(toSpendingSummary(summary)).toEqual({
      totalSpentCents: 425075,
      transactionCount: 47,
      averageTransactionCents: 9044,
      topCategory: 'groceries',
      spentChangePercent: 12.5,
      transactionChangePercent: -3.2,
    });
  });

  it('allows no top category', () => {
    expect(toSpendingSummary({ ...summary, topCategory: null }).topCategory).toBeNull();
  });

  it('rejects a category the app does not know', () => {
    expect(() => toSpendingSummary({ ...summary, topCategory: 'Gambling' })).toThrow(
      InvalidResponseError,
    );
  });
});

describe('toCategoryBreakdown', () => {
  it('maps names to IDs and amounts to cents, ignoring the API colours', () => {
    const result = toCategoryBreakdown({
      dateRange: { startDate: '2024-08-16', endDate: '2024-09-16' },
      totalAmount: 1740.5,
      categories: [
        {
          name: 'Groceries',
          amount: 1250.3,
          percentage: 71.8,
          transactionCount: 15,
          color: '#FF6B6B',
          icon: 'shopping-cart',
        },
        {
          name: 'Transportation',
          amount: 490.2,
          percentage: 28.2,
          transactionCount: 12,
          color: '#45B7D1',
          icon: 'car',
        },
      ],
    });

    expect(result.categories).toEqual([
      { category: 'groceries', totalCents: 125030, transactionCount: 15, percentage: 71.8 },
      { category: 'transport', totalCents: 49020, transactionCount: 12, percentage: 28.2 },
    ]);
  });
});

describe('toSpendingTrends', () => {
  it('turns each month into a chart point starting on the 1st', () => {
    expect(
      toSpendingTrends({
        trends: [
          {
            month: '2024-01',
            totalSpent: 3890.25,
            transactionCount: 42,
            averageTransaction: 92.62,
          },
        ],
      }),
    ).toEqual({ interval: 'month', points: [{ periodStart: '2024-01-01', totalCents: 389025 }] });
  });
});

describe('toChannel', () => {
  it('recognises debit orders and EFTs, treating everything else as card payments', () => {
    expect(toChannel('Debit Order')).toBe('debit_order');
    expect(toChannel('EFT')).toBe('eft');
    expect(toChannel('Credit Card')).toBe('card');
    expect(toChannel('Debit Card')).toBe('card');
  });
});

describe('toTransactionPage', () => {
  const transaction = {
    id: 'txn_123456',
    date: '2024-09-16T14:30:00Z',
    merchant: 'Pick n Pay',
    category: 'Groceries',
    amount: 245.8,
    description: 'Weekly groceries',
    paymentMethod: 'Credit Card',
    icon: 'shopping-cart',
    categoryColor: '#FF6B6B',
  };

  it('maps the documented example', () => {
    const page = toTransactionPage({
      transactions: [transaction],
      pagination: { total: 1250, limit: 20, offset: 0, hasMore: true },
    });

    expect(page.items).toEqual([
      {
        id: 'txn_123456',
        date: '2024-09-16T14:30:00Z',
        merchant: 'Pick n Pay',
        category: 'groceries',
        amountCents: 24580,
        type: 'debit',
        channel: 'card',
        description: 'Weekly groceries',
      },
    ]);
  });

  it('turns offsets into page numbers', () => {
    const page = toTransactionPage({
      transactions: [],
      pagination: { total: 45, limit: 20, offset: 40, hasMore: false },
    });

    expect(page).toMatchObject({ page: 3, pageSize: 20, totalItems: 45, totalPages: 3 });
  });
});

describe('toTransactionsParams', () => {
  it('turns pages into offsets and category IDs into API names', () => {
    expect(
      toTransactionsParams({
        from: '2026-09-11',
        to: '2026-10-10',
        category: 'transport',
        q: 'uber',
        page: 3,
        pageSize: 20,
        sort: 'amount_desc',
      }),
    ).toEqual({
      startDate: '2026-09-11',
      endDate: '2026-10-10',
      category: 'Transportation',
      search: 'uber',
      sortBy: 'amount_desc',
      limit: 20,
      offset: 40,
    });
  });

  it('leaves out filters that are not set', () => {
    expect(toTransactionsParams({ from: '2026-09-11', to: '2026-10-10' })).toMatchObject({
      category: undefined,
      search: undefined,
      offset: 0,
      limit: 20,
      sortBy: 'date_desc',
    });
  });
});

describe('toGoals', () => {
  it('maps the documented example', () => {
    expect(
      toGoals({
        goals: [
          {
            id: 'goal_001',
            category: 'Entertainment',
            monthlyBudget: 1000,
            currentSpent: 650.3,
            percentageUsed: 65.03,
            daysRemaining: 12,
            status: 'on_track',
          },
        ],
      }),
    ).toEqual([
      {
        id: 'goal_001',
        category: 'entertainment',
        budgetCents: 100000,
        spentCents: 65030,
        percentUsed: 65.03,
        daysRemaining: 12,
        status: 'on_track',
      },
    ]);
  });
});
