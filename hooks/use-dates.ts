'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { DateEntry } from '@/types';

export const DATES_PAGE_SIZE = 20;

export const DATE_QUERY_KEYS = {
  all: ['dates'] as const,
  byCoupleId: (coupleId: string) => ['dates', coupleId] as const,
  infinite: (coupleId: string) => ['dates', coupleId, 'infinite'] as const,
  byId: (id: string) => ['dates', 'detail', id] as const,
};

export function useDates(coupleId: string | undefined) {
  return useQuery({
    queryKey: DATE_QUERY_KEYS.byCoupleId(coupleId ?? ''),
    queryFn: async () => {
      if (!coupleId) return [];
      const res = await fetch(`/api/dates?couple_id=${coupleId}`);
      if (!res.ok) throw new Error('Không thể tải dữ liệu');
      const json = await res.json();
      return (json.data ?? []) as DateEntry[];
    },
    enabled: !!coupleId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useInfiniteDates(
  coupleId: string | undefined,
  initialData?: {
    pages: DateEntry[][];
    pageParams: number[];
  }
) {
  return useInfiniteQuery({
    queryKey: DATE_QUERY_KEYS.infinite(coupleId ?? ''),
    queryFn: async ({ pageParam = 0 }) => {
      if (!coupleId) return [];
      const page = (pageParam as number) + 1;
      const res = await fetch(
        `/api/dates?couple_id=${coupleId}&page=${page}&limit=${DATES_PAGE_SIZE}`
      );
      if (!res.ok) {
        throw new Error('Không thể tải kỷ niệm');
      }
      const json = await res.json();
      return (json.data ?? []) as DateEntry[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage || lastPage.length < DATES_PAGE_SIZE) {
        return undefined;
      }
      return (lastPageParam as number) + 1;
    },
    initialData,
    refetchOnMount: false, // Dùng dữ liệu initialData của server, không tự động refetch đè trang 1 khi mount
    enabled: !!coupleId,
    staleTime: 1000 * 60 * 5, // 5 phút
  });
}

export function useDateById(id: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: DATE_QUERY_KEYS.byId(id ?? ''),
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('dates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data as DateEntry;
    },
    enabled: !!id,
  });
}
