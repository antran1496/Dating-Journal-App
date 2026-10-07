'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { keys as queryKeys } from '@/lib/query/keys';
import { getDates, DATES_PAGE_SIZE, getCalendarDates } from '@/lib/queries/dates';
import { useIsClient } from '@/hooks/use-is-client';
import type { CoupleWithMembers } from '@/types';

export function CacheWarmup({ 
  couple, 
  children 
}: { 
  couple: CoupleWithMembers | null;
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const isClient = useIsClient();

  useEffect(() => {
    if (!isClient || !couple?.id) return;
    const supabase = createClient();
    
    // Background prefetch
    queryClient.prefetchQuery({
      queryKey: queryKeys.dates.calendar(couple.id),
      queryFn: () => getCalendarDates(supabase, couple.id),
    });
    
    queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.dates.list(couple.id),
      queryFn: () => getDates(supabase, couple.id, 1, DATES_PAGE_SIZE),
      initialPageParam: 0,
    });
  }, [isClient, couple?.id, queryClient]);

  return <>{children}</>;
}
