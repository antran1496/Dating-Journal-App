'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { DateEntry } from '@/types';
import { keys as queryKeys } from '@/lib/query/keys';
import { getDateById, DATES_PAGE_SIZE, getCalendarDates } from '@/lib/queries/dates';

export interface DateFilters {
  search?: string;
  mood?: string;
  tag?: string;
}

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
  filters?: DateFilters,
  initialData?: {
    pages: DateEntry[][];
    pageParams: number[];
  }
) {
  return useInfiniteQuery({
    queryKey: queryKeys.dates.list(coupleId ?? '', filters),
    queryFn: async ({ pageParam = 0 }) => {
      if (!coupleId) return [];
      const page = (pageParam as number) + 1;
      const params = new URLSearchParams({
        couple_id: coupleId,
        page: String(page),
        limit: String(DATES_PAGE_SIZE),
      });
      if (filters?.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      if (filters?.mood) {
        params.append('mood', filters.mood);
      }
      if (filters?.tag) {
        params.append('tag', filters.tag);
      }

      const res = await fetch(`/api/dates?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Không thể tải danh sách buổi hẹn');
      }
      const json = await res.json();
      return (json.data || []) as DateEntry[];
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

/**
 * T2.8 RPC Ngày này năm ngoái (on_this_day)
 */
export function useOnThisDay(coupleId: string | undefined, day?: string) {
  const supabase = createClient();
  const targetDay = day || new Date().toISOString().slice(0, 10);

  return useQuery({
    queryKey: queryKeys.dates.onThisDay(coupleId ?? '', targetDay),
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase.rpc('on_this_day', {
        p_couple: coupleId,
        p_day: targetDay,
      });

      if (error) {
        console.error('[on_this_day RPC error]', error);
        return [];
      }
      return (data || []) as DateEntry[];
    },
    enabled: !!coupleId,
  });
}
