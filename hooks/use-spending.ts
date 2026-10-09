'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCouple } from './use-couple';
import { keys } from '@/lib/query/keys';
import type { SpendingStats } from '@/lib/spending';

interface SpendingResponse {
  data: SpendingStats;
  authorNames: Record<string, string>;
}

export function useSpending(month?: string) {
  const { couple } = useCouple();
  const coupleId = couple?.id || '';
  const currentMonth = month || new Date().toISOString().slice(0, 7);

  return useQuery<SpendingResponse>({
    queryKey: keys.spending.stats(coupleId, currentMonth),
    queryFn: async () => {
      const res = await fetch(`/api/spending?month=${encodeURIComponent(currentMonth)}`);
      if (!res.ok) {
        throw new Error('Failed to fetch spending stats');
      }
      return res.json();
    },
    enabled: !!coupleId,
    staleTime: 60 * 1000,
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budgetVnd: number | null) => {
      const res = await fetch('/api/spending', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthly_budget_vnd: budgetVnd }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update budget');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spending'] });
      queryClient.invalidateQueries({ queryKey: keys.couple.current() });
    },
  });
}
