'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionUser } from './session-provider';

export function AuthCacheGuard({ children }: { children: React.ReactNode }) {
  const { user } = useSessionUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      // Clear all cache when user logs out
      queryClient.clear();
    }
  }, [user, queryClient]);

  return <>{children}</>;
}
