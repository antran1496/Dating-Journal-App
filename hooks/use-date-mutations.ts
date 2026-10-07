'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { keys as queryKeys } from '@/lib/query/keys';
import type { DateEntry } from '@/types';
import type { DateFormValues } from '@/types/forms';

import { useSessionUser } from '@/components/providers/session-provider';

function cleanPayload<T extends Record<string, unknown>>(input: T): T {
  const result: Record<string, unknown> = { ...input };
  const nullableFields = ['end_date', 'pros', 'cons', 'wish_next_time'];
  for (const field of nullableFields) {
    if (field in result) {
      const val = result[field];
      if (val === '' || (typeof val === 'string' && val.trim() === '')) {
        result[field] = null;
      }
    }
  }
  return result as T;
}

export function useCreateDate(coupleId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { user } = useSessionUser();

  return useMutation({
    mutationFn: async (input: DateFormValues & { checkin_image_url?: string; checkin_image_urls?: string[] }) => {
      if (!user) throw new Error('Chưa đăng nhập');

      const payload = cleanPayload({
        ...input,
        couple_id: coupleId,
        created_by: user.id,
      });

      const { data, error } = await supabase
        .from('dates')
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as DateEntry;
    },
    onSuccess: (newData) => {
      // Phase 5: Cập nhật cache ngay lập tức thay vì đợi refresh
      // Update the infinite dates
      queryClient.setQueryData(queryKeys.dates.list(coupleId), (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData;
        const newPages = [...oldData.pages];
        newPages[0] = [newData, ...newPages[0]];
        return { ...oldData, pages: newPages };
      });
      // Invalidate để bảo đảm dữ liệu đồng bộ
      queryClient.invalidateQueries({ queryKey: queryKeys.dates.scope(coupleId) });
    },
  });
}

export function useUpdateDate(coupleId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<DateFormValues> & { id: string; checkin_image_url?: string; checkin_image_urls?: string[] }) => {
      const payload = cleanPayload(input);

      const { data, error } = await supabase
        .from('dates')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as DateEntry;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.dates.detail(updated.id), updated);
      queryClient.setQueryData(queryKeys.dates.list(coupleId), (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: DateEntry[]) =>
            page.map((date) => (date.id === updated.id ? updated : date))
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dates.scope(coupleId) });
    },
  });
}

export function useDeleteDate(coupleId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dates').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.dates.detail(deletedId) });
      queryClient.setQueryData(queryKeys.dates.list(coupleId), (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: DateEntry[]) =>
            page.filter((date) => date.id !== deletedId)
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dates.scope(coupleId) });
    },
  });
}
