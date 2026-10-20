import {
  toCategoryBreakdown,
  toCustomer,
  toFilters,
  toGoals,
  toSpendingSummary,
  toSpendingTrends,
  toTransactionPage,
  toTransactionsParams,
} from './adapters';
import { apiGet } from './client';
import {
  categoriesResponseSchema,
  goalsResponseSchema,
  filtersResponseSchema,
  profileResponseSchema,
  summaryResponseSchema,
  transactionsResponseSchema,
  trendsResponseSchema,
} from './contract';
import type { ApiPeriod } from './contract';
import type { TransactionQuery } from './schemas';

/** Who is asking, and the proof they're allowed to. */
export type ApiAuth = {
  token: string;
  customerId: string;
};

const customerPath = (customerId: string) => `/api/customers/${encodeURIComponent(customerId)}`;

const withAuth = (auth: ApiAuth, signal?: AbortSignal) => ({ token: auth.token, signal });

/**
 * One function per documented endpoint. Each fetches, validates the response against
 * the documented contract, then translates it into the app's own model.
 */
export const customerApi = {
  // 1. GET /api/customers/{customerId}/profile
  getProfile: async (auth: ApiAuth, signal?: AbortSignal) =>
    toCustomer(
      await apiGet(
        `${customerPath(auth.customerId)}/profile`,
        profileResponseSchema,
        {},
        withAuth(auth, signal),
      ),
    ),

  // 2. GET /api/customers/{customerId}/spending/summary?period=
  getSummary: async (auth: ApiAuth, period: ApiPeriod, signal?: AbortSignal) =>
    toSpendingSummary(
      await apiGet(
        `${customerPath(auth.customerId)}/spending/summary`,
        summaryResponseSchema,
        { period },
        withAuth(auth, signal),
      ),
    ),

  // 3. GET /api/customers/{customerId}/spending/categories?period=
  getCategoryBreakdown: async (auth: ApiAuth, period: ApiPeriod, signal?: AbortSignal) =>
    toCategoryBreakdown(
      await apiGet(
        `${customerPath(auth.customerId)}/spending/categories`,
        categoriesResponseSchema,
        { period },
        withAuth(auth, signal),
      ),
    ),

  // 4. GET /api/customers/{customerId}/spending/trends?months=
  getTrends: async (auth: ApiAuth, months: number, signal?: AbortSignal) =>
    toSpendingTrends(
      await apiGet(
        `${customerPath(auth.customerId)}/spending/trends`,
        trendsResponseSchema,
        { months },
        withAuth(auth, signal),
      ),
    ),

  // 5. GET /api/customers/{customerId}/transactions?limit=&offset=&category=&...
  getTransactions: async (auth: ApiAuth, query: TransactionQuery, signal?: AbortSignal) =>
    toTransactionPage(
      await apiGet(
        `${customerPath(auth.customerId)}/transactions`,
        transactionsResponseSchema,
        toTransactionsParams(query),
        withAuth(auth, signal),
      ),
    ),

  // 6. GET /api/customers/{customerId}/goals
  getGoals: async (auth: ApiAuth, signal?: AbortSignal) =>
    toGoals(
      await apiGet(
        `${customerPath(auth.customerId)}/goals`,
        goalsResponseSchema,
        {},
        withAuth(auth, signal),
      ),
    ),

  // 7. GET /api/customers/{customerId}/filters
  getFilters: async (auth: ApiAuth, signal?: AbortSignal) =>
    toFilters(
      await apiGet(
        `${customerPath(auth.customerId)}/filters`,
        filtersResponseSchema,
        {},
        withAuth(auth, signal),
      ),
    ),
};
