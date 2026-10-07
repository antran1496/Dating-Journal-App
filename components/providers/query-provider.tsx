'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from '@/lib/query/query-client';
import { AuthCacheGuard } from './auth-cache-guard';

let browserQueryClient: ReturnType<typeof makeQueryClient> | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthCacheGuard>{children}</AuthCacheGuard>
    </QueryClientProvider>
  );
}
