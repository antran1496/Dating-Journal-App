'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { differenceInCalendarDays, differenceInMonths, differenceInYears, addDays, addMonths, addYears } from 'date-fns';
import type { CoupleWithMembers } from '@/types';

export const COUPLE_QUERY_KEYS = {
  current: ['couple', 'current'] as const,
};

export type Milestone = {
  label: string;
  date: Date;
  daysUntil: number;
};

function getNextMilestones(anniversaryDate: Date): Milestone[] {
  const today = new Date();
  const milestones: Milestone[] = [];

  // Thêm mốc theo ngày
  const dayMilestones = [100, 200, 300, 365, 500, 700, 730, 1000];
  for (const days of dayMilestones) {
    const date = addDays(anniversaryDate, days);
    if (date > today) {
      milestones.push({
        label: `${days} ngày`,
        date,
        daysUntil: differenceInCalendarDays(date, today),
      });
    }
  }

  // Thêm mốc kỷ niệm năm
  for (let year = 1; year <= 10; year++) {
    const date = addYears(anniversaryDate, year);
    if (date > today) {
      milestones.push({
        label: `${year} năm`,
        date,
        daysUntil: differenceInCalendarDays(date, today),
      });
    }
  }

  // Sắp xếp theo ngày gần nhất và lấy 3 mốc đầu
  return milestones.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 3);
}

export function useCouple() {
  const supabase = createClient();

  const query = useQuery({
    queryKey: COUPLE_QUERY_KEYS.current,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('couple_members')
        .select(`
          couple_id,
          nickname,
          role,
          couple:couples(
            id,
            invite_code,
            anniversary_date,
            relationship_status,
            created_by,
            created_at,
            couple_members(
              couple_id,
              profile_id,
              nickname,
              role,
              profile:profiles(
                id,
                display_name,
                avatar_url,
                birth_date,
                created_at
              )
            )
          )
        `)
        .eq('profile_id', user.id)
        .maybeSingle();

      if (error || !data?.couple) return null;
      return data.couple as unknown as CoupleWithMembers;
    },
    staleTime: 1000 * 60 * 5,
  });

  const couple = query.data;
  const anniversaryDate = couple?.anniversary_date ? new Date(couple.anniversary_date) : null;
  const daysCount = anniversaryDate ? differenceInCalendarDays(new Date(), anniversaryDate) + 1 : null;
  const nextMilestones = anniversaryDate ? getNextMilestones(anniversaryDate) : [];

  return {
    couple,
    daysCount,
    nextMilestones,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
