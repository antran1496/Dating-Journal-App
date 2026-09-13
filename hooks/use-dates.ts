'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { DateEntry } from '@/types';

export const DATE_QUERY_KEYS = {
  all: ['dates'] as const,
  byCoupleId: (coupleId: string) => ['dates', coupleId] as const,
  byId: (id: string) => ['dates', 'detail', id] as const,
};

export function useDates(coupleId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: DATE_QUERY_KEYS.byCoupleId(coupleId ?? ''),
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('dates')
        .select('*')
        .eq('couple_id', coupleId)
        .order('date_time', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as DateEntry[];
    },
    enabled: !!coupleId,
    staleTime: 1000 * 60 * 2,
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
