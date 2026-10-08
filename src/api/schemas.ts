import { z } from 'zod';

export const CATEGORY_IDS = [
  'groceries',
  'dining',
  'transport',
  'fuel',
  'shopping',
  'entertainment',
  'utilities',
  'airtime_data',
  'health',
  'income',
] as const;

export const categoryIdSchema = z.enum(CATEGORY_IDS);
export type CategoryId = z.infer<typeof categoryIdSchema>;

export const transactionSchema = z.object({
  id: z.string(),
  date: z.iso.datetime(),
  merchant: z.string(),
  category: categoryIdSchema,
  /** Always positive; direction is given by `type`. Stored in cents to avoid floating-point errors. */
  amountCents: z.number().int().nonnegative(),
  type: z.enum(['debit', 'credit']),
  channel: z.enum(['card', 'eft', 'debit_order']),
});
export type Transaction = z.infer<typeof transactionSchema>;

export const customerSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  accountNumberMasked: z.string(),
});
export type Customer = z.infer<typeof customerSchema>;

export const spendingSummarySchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
  totalSpentCents: z.number().int(),
  previousPeriodSpentCents: z.number().int(),
  transactionCount: z.number().int(),
  averageTransactionCents: z.number().int(),
  topCategory: categoryIdSchema.nullable(),
});
export type SpendingSummary = z.infer<typeof spendingSummarySchema>;

export const trendIntervalSchema = z.enum(['day', 'week', 'month']);
export type TrendInterval = z.infer<typeof trendIntervalSchema>;

export const spendingTrendsSchema = z.object({
  interval: trendIntervalSchema,
  points: z.array(z.object({ periodStart: z.iso.date(), totalCents: z.number().int() })),
});
export type SpendingTrends = z.infer<typeof spendingTrendsSchema>;

export const categoryBreakdownSchema = z.object({
  categories: z.array(
    z.object({
      category: categoryIdSchema,
      totalCents: z.number().int(),
      transactionCount: z.number().int(),
      percentage: z.number(),
    }),
  ),
});
export type CategoryBreakdown = z.infer<typeof categoryBreakdownSchema>;

export const transactionSortSchema = z.enum(['date_desc', 'date_asc', 'amount_desc', 'amount_asc']);
export type TransactionSort = z.infer<typeof transactionSortSchema>;

export const transactionPageSchema = z.object({
  items: z.array(transactionSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  totalItems: z.number().int(),
  totalPages: z.number().int(),
});
export type TransactionPage = z.infer<typeof transactionPageSchema>;

// ---- Request parameters (validated by the mock server) ----

export const dateRangeParamsSchema = z.object({ from: z.iso.date(), to: z.iso.date() });
export type DateRange = z.infer<typeof dateRangeParamsSchema>;

export const trendsParamsSchema = dateRangeParamsSchema.extend({
  interval: trendIntervalSchema.default('day'),
});

export const transactionsParamsSchema = dateRangeParamsSchema.extend({
  category: categoryIdSchema.optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: transactionSortSchema.default('date_desc'),
});

export type TransactionQuery = DateRange & {
  category?: CategoryId;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: TransactionSort;
};
