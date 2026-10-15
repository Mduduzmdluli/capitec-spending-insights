import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useApiAuth } from '../auth/useAuth';
import { customerApi } from './customerApi';
import type { DateRange, TransactionQuery, TrendInterval } from './schemas';

/** Every key starts with the customer's ID, so each customer's data is cached separately. */
const baseKey = (customerId: string) => ['customer', customerId] as const;

export const queryKeys = {
  profile: (customerId: string) => [...baseKey(customerId), 'profile'] as const,
  summary: (customerId: string, range: DateRange) =>
    [...baseKey(customerId), 'summary', range] as const,
  trends: (customerId: string, range: DateRange, interval: TrendInterval) =>
    [...baseKey(customerId), 'trends', range, interval] as const,
  categories: (customerId: string, range: DateRange) =>
    [...baseKey(customerId), 'categories', range] as const,
  transactions: (customerId: string, query: TransactionQuery) =>
    [...baseKey(customerId), 'transactions', query] as const,
};

export function useCustomer() {
  const auth = useApiAuth();
  return useQuery({
    queryKey: queryKeys.profile(auth.customerId),
    queryFn: ({ signal }) => customerApi.getCustomer(auth, signal),
  });
}

export function useSpendingSummary(range: DateRange) {
  const auth = useApiAuth();
  return useQuery({
    queryKey: queryKeys.summary(auth.customerId, range),
    queryFn: ({ signal }) => customerApi.getSummary(auth, range, signal),
  });
}

export function useSpendingTrends(range: DateRange, interval: TrendInterval) {
  const auth = useApiAuth();
  return useQuery({
    queryKey: queryKeys.trends(auth.customerId, range, interval),
    queryFn: ({ signal }) => customerApi.getTrends(auth, range, interval, signal),
  });
}

export function useCategoryBreakdown(range: DateRange) {
  const auth = useApiAuth();
  return useQuery({
    queryKey: queryKeys.categories(auth.customerId, range),
    queryFn: ({ signal }) => customerApi.getCategoryBreakdown(auth, range, signal),
  });
}

export function useTransactions(query: TransactionQuery) {
  const auth = useApiAuth();
  return useQuery({
    queryKey: queryKeys.transactions(auth.customerId, query),
    queryFn: ({ signal }) => customerApi.getTransactions(auth, query, signal),
    // Keep showing the current page while the next one loads, instead of flashing a skeleton
    placeholderData: keepPreviousData,
  });
}
