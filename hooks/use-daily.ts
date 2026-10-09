'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keys as queryKeys } from '@/lib/query/keys';
import type { DailyAnswer } from '@/types';

export interface DailyData {
  today: {
    question: {
      day: string;
      question_id: number;
      text_vi: string;
      text_en?: string | null;
      category: string;
    } | null;
    day: string;
    streak: number;
    myAnswer: DailyAnswer | null;
    partnerAnswer: DailyAnswer | null;
    myStatus: 'answered' | 'pending';
    partnerStatus: 'answered' | 'pending';
  };
  recent: Array<{
    day: string;
    question: {
      id: number;
      text_vi: string;
      category: string;
    } | null;
    status: 'both_done' | 'missed' | 'pending';
    count: number;
  }>;
}

export function useDailyQuestion(coupleId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.daily.today(coupleId ?? ''),
    queryFn: async (): Promise<DailyData> => {
      const res = await fetch('/api/daily');
      if (!res.ok) {
        throw new Error('Không thể tải câu hỏi hôm nay');
      }
      const json = await res.json();
      return json.data;
    },
    enabled: !!coupleId,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useSubmitDailyAnswer(coupleId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch('/api/daily/answer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Không thể lưu câu trả lời');
      }
      return res.json();
    },
    onSuccess: () => {
      if (coupleId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.daily.today(coupleId) });
      }
    },
  });
}
