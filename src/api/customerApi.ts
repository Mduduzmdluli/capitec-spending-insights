import { apiGet } from './client';
import {
  categoryBreakdownSchema,
  customerSchema,
  spendingSummarySchema,
  spendingTrendsSchema,
  transactionPageSchema,
} from './schemas';
import type { DateRange, TransactionQuery, TrendInterval } from './schemas';

const customerPath = (customerId: string) => `/api/customers/${encodeURIComponent(customerId)}`;

export const customerApi = {
  getCustomer: (customerId: string, signal?: AbortSignal) =>
    apiGet(customerPath(customerId), customerSchema, {}, signal),

  getSummary: (customerId: string, range: DateRange, signal?: AbortSignal) =>
    apiGet(`${customerPath(customerId)}/summary`, spendingSummarySchema, range, signal),

  getTrends: (
    customerId: string,
    range: DateRange,
    interval: TrendInterval,
    signal?: AbortSignal,
  ) =>
    apiGet(
      `${customerPath(customerId)}/spending/trends`,
      spendingTrendsSchema,
      { ...range, interval },
      signal,
    ),

  getCategoryBreakdown: (customerId: string, range: DateRange, signal?: AbortSignal) =>
    apiGet(
      `${customerPath(customerId)}/spending/categories`,
      categoryBreakdownSchema,
      range,
      signal,
    ),

  getTransactions: (customerId: string, query: TransactionQuery, signal?: AbortSignal) =>
    apiGet(`${customerPath(customerId)}/transactions`, transactionPageSchema, query, signal),
};
