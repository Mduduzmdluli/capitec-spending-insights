import { z } from 'zod';

/**
 * The app's own data model, used throughout the UI. API responses arrive in the shape
 * described in contract.ts and are translated into these types by adapters.ts.
 */

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
  /** Always positive; direction is given by `type`. Whole cents avoid floating-point errors. */
  amountCents: z.number().int().nonnegative(),
  type: z.enum(['debit', 'credit']),
  channel: z.enum(['card', 'eft', 'debit_order']),
  description: z.string().optional(),
});
export type Transaction = z.infer<typeof transactionSchema>;

export type Customer = {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  accountType: string;
  totalSpentCents: number;
  currency: string;
};

export type SpendingSummary = {
  totalSpentCents: number;
  transactionCount: number;
  averageTransactionCents: number;
  topCategory: CategoryId | null;
  /** Percentage change against the previous period, or null if there's nothing to compare */
  spentChangePercent: number | null;
  transactionChangePercent: number | null;
};

export const trendIntervalSchema = z.enum(['day', 'week', 'month']);
export type TrendInterval = z.infer<typeof trendIntervalSchema>;

export type SpendingTrends = {
  interval: TrendInterval;
  points: { periodStart: string; totalCents: number }[];
};

export type CategoryBreakdown = {
  categories: {
    category: CategoryId;
    totalCents: number;
    transactionCount: number;
    percentage: number;
  }[];
};

export const transactionSortSchema = z.enum(['date_desc', 'date_asc', 'amount_desc', 'amount_asc']);
export type TransactionSort = z.infer<typeof transactionSortSchema>;

export type TransactionPage = {
  items: Transaction[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type DateRange = { from: string; to: string };

export type TransactionQuery = DateRange & {
  category?: CategoryId;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: TransactionSort;
};

// ---- Authentication (an addition beyond the documented API) ----

export const loginRequestSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const sessionSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.iso.datetime(),
  /** Who is signed in; their full profile comes from the profile endpoint */
  customer: z.object({ id: z.string(), name: z.string() }),
});
export type Session = z.infer<typeof sessionSchema>;
