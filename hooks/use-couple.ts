'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { useSessionUser } from '@/components/providers/session-provider';
import { keys as queryKeys } from '@/lib/query/keys';
import { getCouple } from '@/lib/queries/couple';
import {
  parseLocalDate,
  getNextMilestones,
  getTodayMilestone,
  getUpcomingMilestones,
  calculateMilestoneProgress,
  type Milestone,
  type MilestoneType,
} from '@/lib/milestones';

export type { Milestone, MilestoneType };
export {
  parseLocalDate,
  getNextMilestones,
  getTodayMilestone,
  getUpcomingMilestones,
  calculateMilestoneProgress,
};

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
  const nextMilestones = getNextMilestones(anniversaryDate, couple?.couple_members, user?.id);
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
