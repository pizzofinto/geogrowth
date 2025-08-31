'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider - React Query client provider for client-side caching
 * 
 * Performance Configuration:
 * - staleTime: 5 minutes (data stays fresh for 5 minutes)
 * - cacheTime: 10 minutes (data kept in memory for 10 minutes)
 * - refetchOnWindowFocus: false (prevent excessive refetches)
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient instance with performance optimizations
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000, 
            // Keep unused data in cache for 10 minutes
            cacheTime: 10 * 60 * 1000,
            // Don't refetch on window focus to avoid unnecessary requests
            refetchOnWindowFocus: false,
            // Retry failed requests up to 2 times
            retry: 2,
            // Retry delay with exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}