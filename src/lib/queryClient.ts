import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized React Query client.
 * - retries transient errors with exponential backoff (max 2 retries)
 * - 30s staleTime keeps UI snappy and prevents fetch storms
 * - 5min gcTime keeps recently-used data warm in memory
 * - never refetch on window focus (mobile-first, avoids surprise loaders)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx-style errors (RLS denial, not found, bad input)
        const code = error?.code ?? error?.status;
        if (typeof code === 'number' && code >= 400 && code < 500) return false;
        if (typeof code === 'string' && /^(PGRST|42|23)/.test(code)) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
