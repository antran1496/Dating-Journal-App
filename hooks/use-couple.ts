'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { differenceInCalendarDays, addDays, addYears, startOfDay } from 'date-fns';
import { useSessionUser } from '@/components/providers/session-provider';
import type { CoupleWithMembers } from '@/types';
import { keys as queryKeys } from '@/lib/query/keys';
import { getCouple } from '@/lib/queries/couple';

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
  const { user } = useSessionUser();

  const query = useQuery({
    queryKey: queryKeys.couple.current(),
    queryFn: async () => {
      if (!user) return null;
      return getCouple(supabase, user.id);
    },
    enabled: !!user,
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

