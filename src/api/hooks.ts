import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CUSTOMER_ID } from '../config';
import { customerApi } from './customerApi';
import type { DateRange, TransactionQuery, TrendInterval } from './schemas';

const baseKey = ['customer', CUSTOMER_ID] as const;

export const queryKeys = {
  all: baseKey,
  profile: () => [...baseKey, 'profile'] as const,
  summary: (range: DateRange) => [...baseKey, 'summary', range] as const,
  trends: (range: DateRange, interval: TrendInterval) =>
    [...baseKey, 'trends', range, interval] as const,
  categories: (range: DateRange) => [...baseKey, 'categories', range] as const,
  transactions: (query: TransactionQuery) => [...baseKey, 'transactions', query] as const,
};

export function useCustomer() {
  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: ({ signal }) => customerApi.getCustomer(CUSTOMER_ID, signal),
  });
}

export function useSpendingSummary(range: DateRange) {
  return useQuery({
    queryKey: queryKeys.summary(range),
    queryFn: ({ signal }) => customerApi.getSummary(CUSTOMER_ID, range, signal),
  });
}

export function useSpendingTrends(range: DateRange, interval: TrendInterval) {
  return useQuery({
    queryKey: queryKeys.trends(range, interval),
    queryFn: ({ signal }) => customerApi.getTrends(CUSTOMER_ID, range, interval, signal),
  });
}

export function useCategoryBreakdown(range: DateRange) {
  return useQuery({
    queryKey: queryKeys.categories(range),
    queryFn: ({ signal }) => customerApi.getCategoryBreakdown(CUSTOMER_ID, range, signal),
  });
}

export function useTransactions(query: TransactionQuery) {
  return useQuery({
    queryKey: queryKeys.transactions(query),
    queryFn: ({ signal }) => customerApi.getTransactions(CUSTOMER_ID, query, signal),
    // Keep showing the current page while the next one loads, instead of flashing a spinner
    placeholderData: keepPreviousData,
  });
}
