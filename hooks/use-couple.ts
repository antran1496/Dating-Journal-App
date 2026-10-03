'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { differenceInCalendarDays, addDays, addYears, startOfDay } from 'date-fns';
import type { CoupleWithMembers } from '@/types';

export const COUPLE_QUERY_KEYS = {
  current: ['couple', 'current'] as const,
};

export type Milestone = {
  label: string;
  date: Date;
  daysUntil: number;
};

function parseLocalDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) return startOfDay(dateInput);
  const dateStr = String(dateInput).split('T')[0];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return startOfDay(new Date(dateInput));
}

function getNextMilestones(anniversaryDate: Date): Milestone[] {
  const today = startOfDay(new Date());
  const milestones: Milestone[] = [];

  // Thêm mốc theo ngày (Mốc N ngày là ngày thứ N kỉ niệm)
  const dayMilestones = [100, 200, 300, 365, 500, 700, 730, 1000];
  for (const days of dayMilestones) {
    const date = startOfDay(addDays(anniversaryDate, days - 1));
    const daysUntil = differenceInCalendarDays(date, today);
    if (daysUntil >= 0) {
      milestones.push({
        label: `${days} ngày`,
        date,
        daysUntil,
      });
    }
  }

  // Thêm mốc kỷ niệm năm
  for (let year = 1; year <= 10; year++) {
    const date = startOfDay(addYears(anniversaryDate, year));
    const daysUntil = differenceInCalendarDays(date, today);
    if (daysUntil >= 0) {
      milestones.push({
        label: `${year} năm`,
        date,
        daysUntil,
      });
    }
  }

  // Sắp xếp theo ngày gần nhất và lấy 3 mốc đầu
  return milestones.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 3);
}

export function getTodayMilestone(milestones: Milestone[]): Milestone | null {
  return milestones.find(m => m.daysUntil === 0) || null;
}

export function getUpcomingMilestones(milestones: Milestone[], threshold: number): Milestone[] {
  return milestones.filter(m => m.daysUntil > 0 && m.daysUntil <= threshold);
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
  const today = startOfDay(new Date());
  const anniversaryDate = couple?.anniversary_date ? parseLocalDate(couple.anniversary_date) : null;
  const daysCount = anniversaryDate ? differenceInCalendarDays(today, anniversaryDate) + 1 : null;
  const nextMilestones = anniversaryDate ? getNextMilestones(anniversaryDate) : [];
  const todayMilestone = getTodayMilestone(nextMilestones);
  const upcomingAlerts = getUpcomingMilestones(nextMilestones, 7);

  return {
    couple,
    daysCount,
    nextMilestones,
    todayMilestone,
    upcomingAlerts,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
