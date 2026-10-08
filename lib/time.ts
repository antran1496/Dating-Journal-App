import { TZDate } from '@date-fns/tz';
import { format as dateFnsFormat, startOfDay as dateFnsStartOfDay } from 'date-fns';

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Returns current timestamp in Vietnam timezone (Asia/Ho_Chi_Minh).
 */
export function nowVN(): TZDate {
  return new TZDate(new Date(), VIETNAM_TIMEZONE);
}

/**
 * Converts a Date, ISO string, or timestamp to a TZDate in Vietnam timezone.
 */
export function toVN(date: Date | string | number): TZDate {
  return new TZDate(new Date(date), VIETNAM_TIMEZONE);
}

/**
 * Returns the current date string in Vietnam as 'yyyy-MM-dd'.
 */
export function todayVN(): string {
  return dateFnsFormat(nowVN(), 'yyyy-MM-dd');
}

/**
 * Returns start of day in Vietnam timezone for a given date (defaults to now).
 */
export function startOfDayVN(date?: Date | string | number): TZDate {
  const d = date ? toVN(date) : nowVN();
  return new TZDate(dateFnsStartOfDay(d), VIETNAM_TIMEZONE);
}

/**
 * Formats a date using date-fns format string evaluated in Vietnam timezone.
 */
export function formatVN(date: Date | string | number, pattern: string): string {
  return dateFnsFormat(toVN(date), pattern);
}
