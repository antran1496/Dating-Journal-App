import { format, subDays } from 'date-fns';

export interface DailyAnswerRow {
  day: string; // YYYY-MM-DD
  profile_id: string;
}

/**
 * Calculates current streak in Asia/Ho_Chi_Minh (UTC+7) timezone.
 * A day is completed if distinct profile_ids answering on that day >= requiredCount.
 * Streak counts backwards from today (if completed) or yesterday (if today is still pending).
 */
export function calculateStreak(
  answers: DailyAnswerRow[],
  requiredCount: number = 2,
  referenceDate: Date = new Date()
): number {
  if (requiredCount <= 0 || !answers || answers.length === 0) {
    return 0;
  }

  // Get current date string in Vietnam timezone (UTC+7)
  const vnDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(referenceDate);

  // Group answer counts by day
  const dayAnswerMap = new Map<string, Set<string>>();
  for (const ans of answers) {
    if (!dayAnswerMap.has(ans.day)) {
      dayAnswerMap.set(ans.day, new Set());
    }
    dayAnswerMap.get(ans.day)!.add(ans.profile_id);
  }

  const isDayCompleted = (dayStr: string): boolean => {
    const profiles = dayAnswerMap.get(dayStr);
    return !!profiles && profiles.size >= requiredCount;
  };

  const todayCompleted = isDayCompleted(vnDateStr);

  // Parse YYYY-MM-DD
  const [y, m, d] = vnDateStr.split('-').map(Number);
  const todayDate = new Date(y, m - 1, d);

  let checkDate: Date;
  if (todayCompleted) {
    checkDate = todayDate;
  } else {
    // Today is not completed yet; check if yesterday was completed
    const yesterdayDate = subDays(todayDate, 1);
    const yesterdayStr = format(yesterdayDate, 'yyyy-MM-dd');
    if (isDayCompleted(yesterdayStr)) {
      checkDate = yesterdayDate;
    } else {
      return 0;
    }
  }

  let streak = 0;
  let curr = checkDate;

  while (true) {
    const currStr = format(curr, 'yyyy-MM-dd');
    if (isDayCompleted(currStr)) {
      streak += 1;
      curr = subDays(curr, 1);
    } else {
      break;
    }
  }

  return streak;
}
