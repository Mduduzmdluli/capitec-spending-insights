import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useApiAuth } from '../auth/useAuth';
import type { Period } from '../lib/period';
import { customerApi } from './customerApi';
import type { TransactionQuery } from './schemas';

/** Every key starts with the customer's ID, so each customer's data is cached separately. */
const baseKey = (customerId: string) => ['customer', customerId] as const;

export const queryKeys = {
  profile: (customerId: string) => [...baseKey(customerId), 'profile'] as const,
  summary: (customerId: string, period: Period) =>
    [...baseKey(customerId), 'summary', period] as const,
  categories: (customerId: string, period: Period) =>
    [...baseKey(customerId), 'categories', period] as const,
  trends: (customerId: string, months: number) =>
    [...baseKey(customerId), 'trends', months] as const,
  transactions: (customerId: string, query: TransactionQuery) =>
    [...baseKey(customerId), 'transactions', query] as const,
  goals: (customerId: string) => [...baseKey(customerId), 'goals'] as const,
};

export function useCustomer() {
  const auth = useApiAuth();
  return useQuery({
    queryKey: queryKeys.profile(auth.customerId),
    queryFn: ({ signal }) => customerApi.getProfile(auth, signal),
  });
}

export function useSpendingSummary(period: Period) {
  const auth = useApiAuth();
  return useQuery({
    queryKey: queryKeys.summary(auth.customerId, period),
    queryFn: ({ signal }) => customerApi.getSummary(auth, period, signal),
  });
}

export function useCategoryBreakdown(period: Period) {
  const auth = useApiAuth();
  return useQuery({
    queryKey: queryKeys.categories(auth.customerId, period),
    queryFn: ({ signal }) => customerApi.getCategoryBreakdown(auth, period, signal),
  });
}

export function useSpendingTrends(months = 12) {
  const auth = useApiAuth();
  return useQuery({
    queryKey: queryKeys.trends(auth.customerId, months),
    queryFn: ({ signal }) => customerApi.getTrends(auth, months, signal),
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

export function useGoals() {
  const auth = useApiAuth();
  return useQuery({
    queryKey: queryKeys.goals(auth.customerId),
    queryFn: ({ signal }) => customerApi.getGoals(auth, signal),
  });
}
