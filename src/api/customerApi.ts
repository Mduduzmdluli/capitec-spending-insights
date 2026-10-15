import { apiGet } from './client';
import {
  categoryBreakdownSchema,
  customerSchema,
  spendingSummarySchema,
  spendingTrendsSchema,
  transactionPageSchema,
} from './schemas';
import type { DateRange, TransactionQuery, TrendInterval } from './schemas';

/** Who is asking, and the proof they're allowed to. */
export type ApiAuth = {
  token: string;
  customerId: string;
};

const customerPath = (customerId: string) => `/api/customers/${encodeURIComponent(customerId)}`;

export const customerApi = {
  getCustomer: (auth: ApiAuth, signal?: AbortSignal) =>
    apiGet(customerPath(auth.customerId), customerSchema, {}, { token: auth.token, signal }),

  getSummary: (auth: ApiAuth, range: DateRange, signal?: AbortSignal) =>
    apiGet(`${customerPath(auth.customerId)}/summary`, spendingSummarySchema, range, {
      token: auth.token,
      signal,
    }),

  getTrends: (auth: ApiAuth, range: DateRange, interval: TrendInterval, signal?: AbortSignal) =>
    apiGet(
      `${customerPath(auth.customerId)}/spending/trends`,
      spendingTrendsSchema,
      { ...range, interval },
      { token: auth.token, signal },
    ),

  getCategoryBreakdown: (auth: ApiAuth, range: DateRange, signal?: AbortSignal) =>
    apiGet(`${customerPath(auth.customerId)}/spending/categories`, categoryBreakdownSchema, range, {
      token: auth.token,
      signal,
    }),

  getTransactions: (auth: ApiAuth, query: TransactionQuery, signal?: AbortSignal) =>
    apiGet(`${customerPath(auth.customerId)}/transactions`, transactionPageSchema, query, {
      token: auth.token,
      signal,
    }),
};
