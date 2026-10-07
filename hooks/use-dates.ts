'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { DateEntry } from '@/types';
import { keys as queryKeys } from '@/lib/query/keys';
import { getDates, getDateById, DATES_PAGE_SIZE, getCalendarDates } from '@/lib/queries/dates';

export function useCalendarDates(coupleId: string | undefined) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.dates.calendar(coupleId ?? ''),
    queryFn: async () => {
      if (!coupleId) return [];
      return getCalendarDates(supabase, coupleId);
    },
    enabled: !!coupleId,
  });
}

export function useInfiniteDates(
  coupleId: string | undefined,
  initialData?: {
    pages: DateEntry[][];
    pageParams: number[];
  }
) {
  const supabase = createClient();
  return useInfiniteQuery({
    queryKey: queryKeys.dates.list(coupleId ?? ''),
    queryFn: async ({ pageParam = 0 }) => {
      if (!coupleId) return [];
      const page = (pageParam as number) + 1;
      return getDates(supabase, coupleId, page, DATES_PAGE_SIZE);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage || lastPage.length < DATES_PAGE_SIZE) {
        return undefined;
      }
      return (lastPageParam as number) + 1;
    },
    initialData,
    enabled: !!coupleId,
  });
}

export function useDateById(id: string | undefined, initialData?: DateEntry) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.dates.detail(id ?? ''),
    queryFn: async () => {
      if (!id) return null;
      return getDateById(supabase, id);
    },
    enabled: !!id,
    initialData,
  });
}

