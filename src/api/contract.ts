import { z } from 'zod';
import type { CategoryId } from './schemas';

/**
 * Customer Spending Insights  Dashboard API Endpoints".
 * Amounts are decimal rand and categories are display names.
 * adapters.ts translates these responses into the app's own model in schemas.ts.
 */

export const API_PERIODS = ['7d', '30d', '90d', '1y'] as const;
export const apiPeriodSchema = z.enum(API_PERIODS);
export type ApiPeriod = z.infer<typeof apiPeriodSchema>;

export const apiSortSchema = z.enum(['date_desc', 'date_asc', 'amount_desc', 'amount_asc']);

/** The name the API uses for each of the app's categories. */
export const CATEGORY_API_NAMES: Record<CategoryId, string> = {
  groceries: 'Groceries',
  dining: 'Dining',
  transport: 'Transportation',
  fuel: 'Fuel',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  utilities: 'Utilities',
  airtime_data: 'Airtime & Data',
  health: 'Health & Fitness',
  income: 'Income',
};

const categoryIdsByName = new Map(
  Object.entries(CATEGORY_API_NAMES).map(([id, name]) => [name.toLowerCase(), id as CategoryId]),
);

/** The app's ID for a category name from the API, matched case-insensitively. */
export function categoryIdFromApiName(name: string): CategoryId | undefined {
  return categoryIdsByName.get(name.trim().toLowerCase());
}

const money = z.number();
const count = z.number().int().nonnegative();

// ---- 1. Customer profile: GET /api/customers/{customerId}/profile ----

export const profileResponseSchema = z.object({
  customerId: z.string(),
  name: z.string(),
  email: z.string(),
  joinDate: z.iso.date(),
  accountType: z.string(),
  totalSpent: money,
  currency: z.string(),
});
export type ProfileResponse = z.infer<typeof profileResponseSchema>;

// ---- 2. Spending summary: GET /api/customers/{customerId}/spending/summary ----

export const summaryQuerySchema = z.object({
  period: apiPeriodSchema.default('30d'),
});

export const summaryResponseSchema = z.object({
  period: apiPeriodSchema,
  totalSpent: money,
  transactionCount: count,
  averageTransaction: money,
  topCategory: z.string().nullable(),
  comparedToPrevious: z.object({
    /** Percentage change; null when the previous period had nothing to compare with */
    spentChange: z.number().nullable(),
    transactionChange: z.number().nullable(),
  }),
});
export type SummaryResponse = z.infer<typeof summaryResponseSchema>;

// ---- 3. Spending by category: GET /api/customers/{customerId}/spending/categories ----

export const categoriesQuerySchema = z.object({
  period: apiPeriodSchema.default('30d'),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
});

export const categoriesResponseSchema = z.object({
  dateRange: z.object({ startDate: z.iso.date(), endDate: z.iso.date() }),
  totalAmount: money,
  categories: z.array(
    z.object({
      name: z.string(),
      amount: money,
      percentage: z.number(),
      transactionCount: count,
      color: z.string(),
      icon: z.string(),
    }),
  ),
});
export type CategoriesResponse = z.infer<typeof categoriesResponseSchema>;

// ---- 4. Monthly spending trends: GET /api/customers/{customerId}/spending/trends ----

export const trendsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(12),
});

export const trendsResponseSchema = z.object({
  trends: z.array(
    z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/, 'Expected a month as YYYY-MM'),
      totalSpent: money,
      transactionCount: count,
      averageTransaction: money,
    }),
  ),
});
export type TrendsResponse = z.infer<typeof trendsResponseSchema>;

// ---- 5. Transactions: GET /api/customers/{customerId}/transactions ----

export const transactionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  category: z.string().optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  sortBy: apiSortSchema.default('date_desc'),
  /** Not in the documented API: a proposed extension for searching by merchant */
  search: z.string().trim().max(100).optional(),
});

export const transactionsResponseSchema = z.object({
  transactions: z.array(
    z.object({
      id: z.string(),
      date: z.iso.datetime(),
      merchant: z.string(),
      category: z.string(),
      amount: money,
      description: z.string().optional(),
      paymentMethod: z.string(),
      icon: z.string().optional(),
      categoryColor: z.string().optional(),
    }),
  ),
  pagination: z.object({
    total: count,
    limit: z.number().int().positive(),
    offset: count,
    hasMore: z.boolean(),
  }),
});
export type TransactionsResponse = z.infer<typeof transactionsResponseSchema>;

// ---- 6. Spending goals: GET /api/customers/{customerId}/goals ----

/**
 * The document shows "on_track" and "warning". It doesn't name a status for spending
 * past the budget, so "exceeded" is an assumption, noted in the README.
 */
export const GOAL_STATUSES = ['on_track', 'warning', 'exceeded'] as const;

export const goalsResponseSchema = z.object({
  goals: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      monthlyBudget: money,
      currentSpent: money,
      percentageUsed: z.number(),
      daysRemaining: count,
      status: z.enum(GOAL_STATUSES),
    }),
  ),
});
export type GoalsResponse = z.infer<typeof goalsResponseSchema>;

// ---- 7. Available categories and filters: GET /api/customers/{customerId}/filters ----

export const filtersResponseSchema = z.object({
  categories: z.array(z.object({ name: z.string(), color: z.string(), icon: z.string() })),
  dateRangePresets: z.array(
    // Any string, so a new preset added by the server doesn't break validation
    z.object({ label: z.string(), value: z.string() }),
  ),
});
export type FiltersResponse = z.infer<typeof filtersResponseSchema>;
