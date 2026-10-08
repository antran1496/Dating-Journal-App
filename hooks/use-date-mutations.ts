'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { keys as queryKeys } from '@/lib/query/keys';
import type { DateEntry } from '@/types';
import type { DateFormValues, DatePlaceInput, DateMediaInput } from '@/types/forms';

export type CreateDatePayload = DateFormValues & {
  places?: DatePlaceInput[];
  media?: DateMediaInput[];
  checkin_image_url?: string;
  checkin_image_urls?: string[];
};

export type UpdateDatePayload = Partial<DateFormValues> & {
  id: string;
  places?: DatePlaceInput[];
  media?: DateMediaInput[];
  checkin_image_url?: string;
  checkin_image_urls?: string[];
};

export function useCreateDate(coupleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDatePayload) => {
      const res = await fetch('/api/dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          couple_id: coupleId,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Không thể tạo buổi hẹn, vui lòng thử lại');
      }

      return json.data as DateEntry;
    },
    onSuccess: (newData) => {
      // Cập nhật cache ngay lập tức
      queryClient.setQueryData(
        queryKeys.dates.list(coupleId),
        (oldData: { pages?: DateEntry[][] } | undefined) => {
          if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData;
          const newPages = [...oldData.pages];
          newPages[0] = [newData, ...newPages[0]];
          return { ...oldData, pages: newPages };
        }
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.dates.scope(coupleId) });
    },
  });
}

export function useUpdateDate(coupleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateDatePayload) => {
      const res = await fetch(`/api/dates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Không thể cập nhật buổi hẹn');
      }

      return json.data as DateEntry;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.dates.detail(updated.id), updated);
      queryClient.setQueryData(
        queryKeys.dates.list(coupleId),
        (oldData: { pages?: DateEntry[][] } | undefined) => {
          if (!oldData || !oldData.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: DateEntry[]) =>
              page.map((date) => (date.id === updated.id ? updated : date))
            ),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.dates.scope(coupleId) });
    },
  });
}

export function useDeleteDate(coupleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dates/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Không thể xóa buổi hẹn');
      }

      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.dates.detail(deletedId) });
      queryClient.setQueryData(
        queryKeys.dates.list(coupleId),
        (oldData: { pages?: DateEntry[][] } | undefined) => {
          if (!oldData || !oldData.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: DateEntry[]) =>
              page.filter((date) => date.id !== deletedId)
            ),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.dates.scope(coupleId) });
    },
  });
}
