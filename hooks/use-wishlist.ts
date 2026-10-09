'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keys as queryKeys } from '@/lib/query/keys';
import type { WishlistItem } from '@/types';

export function useWishlist(coupleId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.wishlist.list(coupleId ?? ''),
    queryFn: async (): Promise<WishlistItem[]> => {
      const res = await fetch('/api/wishlist');
      if (!res.ok) {
        throw new Error('Không thể tải danh sách điều muốn làm');
      }
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!coupleId,
  });
}

export function useCreateWishlistItem(coupleId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title: string; note?: string; budget_vnd?: number }) => {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Không thể thêm mục mới');
      }
      return res.json();
    },
    onSuccess: () => {
      if (coupleId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.list(coupleId) });
      }
    },
  });
}

export function useToggleWishlistItem(coupleId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const res = await fetch(`/api/wishlist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Không thể cập nhật');
      }
      return res.json();
    },
    onSuccess: () => {
      if (coupleId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.list(coupleId) });
      }
    },
  });
}

export function useDeleteWishlistItem(coupleId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/wishlist/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Không thể xoá');
      }
      return res.json();
    },
    onSuccess: () => {
      if (coupleId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.list(coupleId) });
      }
    },
  });
}
