'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { keys as queryKeys } from '@/lib/query/keys';
import { getDates, DATES_PAGE_SIZE, getCalendarDates } from '@/lib/queries/dates';
import { useIsClient } from '@/hooks/use-is-client';
import type { CoupleWithMembers, DateEntry } from '@/types';

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
      queryFn: async () => {
        const from = 0;
        const to = DATES_PAGE_SIZE - 1;
        const { data, count } = await supabase
          .from('dates')
          .select('*, places:date_places(*), media:date_media(*), date_places(*), date_media(*)', { count: 'exact' })
          .eq('couple_id', couple.id)
          .order('date_time', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .range(from, to);

        const mappedData = (data ?? []).map((entry) => {
          const e = entry as Record<string, unknown>;
          return {
            ...e,
            media: (e.media as unknown[])?.length ? e.media : e.date_media || [],
            places: (e.places as unknown[])?.length ? e.places : e.date_places || [],
          };
        });

        return {
          data: mappedData as unknown as DateEntry[],
          total: count ?? mappedData.length,
        };
      },
      initialPageParam: 0,
    });
  }, [isClient, couple?.id, queryClient]);

  return <>{children}</>;
}
