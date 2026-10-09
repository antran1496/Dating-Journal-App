import { differenceInCalendarDays, addDays, addYears, startOfDay } from 'date-fns';
import type { CoupleMember, Profile } from '@/types';

export type CoupleMemberWithProfile = CoupleMember & {
  profile: Profile;
};

export type MilestoneType = 'days' | 'anniversary' | 'birthday';

export type Milestone = {
  label: string;
  date: Date;
  daysUntil: number;
  type: MilestoneType;
  targetDays?: number;
};

export function parseLocalDate(dateInput: string | Date): Date {
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

export function getNextMilestones(
  anniversaryDate: Date | null,
  members?: CoupleMemberWithProfile[],
  currentUserId?: string,
  referenceDate: Date = new Date()
): Milestone[] {
  const today = startOfDay(referenceDate);
  const milestones: Milestone[] = [];

  if (anniversaryDate) {
    // 1. Mốc theo ngày (Mốc N ngày là ngày thứ N kỉ niệm)
    const dayMilestones = [100, 200, 300, 365, 500, 700, 730, 1000, 1500, 2000, 3000, 5000];
    for (const days of dayMilestones) {
      const date = startOfDay(addDays(anniversaryDate, days - 1));
      const daysUntil = differenceInCalendarDays(date, today);
      if (daysUntil >= 0) {
        milestones.push({
          label: `${days} ngày`,
          date,
          daysUntil,
          type: 'days',
          targetDays: days,
        });
      }
    }

    // 2. Mốc kỷ niệm năm
    for (let year = 1; year <= 20; year++) {
      const date = startOfDay(addYears(anniversaryDate, year));
      const daysUntil = differenceInCalendarDays(date, today);
      if (daysUntil >= 0) {
        milestones.push({
          label: `${year} năm`,
          date,
          daysUntil,
          type: 'anniversary',
          targetDays: year * 365,
        });
      }
    }
  }

  // 3. Sinh nhật người ấy
  if (members && members.length > 0) {
    const partner =
      members.find((m) => m.profile_id !== currentUserId) ??
      (members.length === 1 ? members[0] : null);

    if (partner?.profile?.birth_date) {
      const bdayStr = String(partner.profile.birth_date).split('T')[0];
      const parts = bdayStr.split('-');
      if (parts.length === 3) {
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);

        let nextBday = new Date(today.getFullYear(), month, day);
        let daysUntil = differenceInCalendarDays(nextBday, today);
        if (daysUntil < 0) {
          nextBday = new Date(today.getFullYear() + 1, month, day);
          daysUntil = differenceInCalendarDays(nextBday, today);
        }

        const partnerName =
          partner.nickname?.trim() || partner.profile.display_name?.trim() || 'người ấy';
        milestones.push({
          label: `🎂 Sinh nhật ${partnerName}`,
          date: nextBday,
          daysUntil,
          type: 'birthday',
          targetDays: 365,
        });
      }
    }
  }

  // Sắp xếp theo ngày gần nhất và lấy 3 mốc đầu
  return milestones.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 3);
}

export function getTodayMilestone(milestones: Milestone[]): Milestone | null {
  return milestones.find((m) => m.daysUntil === 0) || null;
}

export function getUpcomingMilestones(milestones: Milestone[], threshold: number): Milestone[] {
  return milestones.filter((m) => m.daysUntil > 0 && m.daysUntil <= threshold);
}

export function calculateMilestoneProgress(
  milestone: Milestone,
  daysCount: number | null
): number {
  if (milestone.type === 'birthday') {
    const elapsed = 365 - milestone.daysUntil;
    return Math.max(5, Math.min(100, Math.round((elapsed / 365) * 100)));
  }

  if (milestone.type === 'days' && milestone.targetDays && daysCount !== null) {
    const dayMilestones = [0, 100, 200, 300, 365, 500, 700, 730, 1000, 1500, 2000, 3000];
    const prevMilestone = Math.max(
      0,
      ...dayMilestones.filter((d) => d < milestone.targetDays!)
    );
    const span = milestone.targetDays - prevMilestone;
    const elapsed = daysCount - prevMilestone;
    if (span > 0) {
      return Math.max(5, Math.min(100, Math.round((elapsed / span) * 100)));
    }
  }

  if (milestone.type === 'anniversary' && daysCount !== null && milestone.targetDays) {
    const prevYearDays = milestone.targetDays - 365;
    const span = 365;
    const elapsed = daysCount - prevYearDays;
    return Math.max(5, Math.min(100, Math.round((elapsed / span) * 100)));
  }

  return 50;
}
