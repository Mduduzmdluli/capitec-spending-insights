import { QueryClient } from '@tanstack/react-query';
import { ApiError, InvalidResponseError } from './client';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Retrying won't fix a bad request or a contract mismatch
          if (error instanceof InvalidResponseError) return false;
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });
}
