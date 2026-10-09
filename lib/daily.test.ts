import { describe, it, expect } from 'vitest';
import { calculateStreak, type DailyAnswerRow } from './daily';

describe('lib/daily (calculateStreak)', () => {
  // Reference: 2026-10-09 10:00:00 UTC (17:00:00 Vietnam time)
  const refDate = new Date('2026-10-09T10:00:00Z');

  it('returns 0 when there are no answers or required count is 0', () => {
    expect(calculateStreak([], 2, refDate)).toBe(0);
    expect(calculateStreak([{ day: '2026-10-09', profile_id: 'u1' }], 0, refDate)).toBe(0);
  });

  it('returns 0 when neither today nor yesterday was completed', () => {
    const answers: DailyAnswerRow[] = [
      { day: '2026-10-09', profile_id: 'u1' }, // only 1 of 2 answered today
      { day: '2026-10-07', profile_id: 'u1' },
      { day: '2026-10-07', profile_id: 'u2' }, // completed 2 days ago
    ];
    expect(calculateStreak(answers, 2, refDate)).toBe(0);
  });

  it('returns 1 when today is completed and yesterday was not', () => {
    const answers: DailyAnswerRow[] = [
      { day: '2026-10-09', profile_id: 'u1' },
      { day: '2026-10-09', profile_id: 'u2' },
    ];
    expect(calculateStreak(answers, 2, refDate)).toBe(1);
  });

  it('preserves streak from yesterday when today is still pending', () => {
    // Yesterday 2026-10-08 and day before 2026-10-07 completed
    const answers: DailyAnswerRow[] = [
      { day: '2026-10-09', profile_id: 'u1' }, // today only u1 answered
      { day: '2026-10-08', profile_id: 'u1' },
      { day: '2026-10-08', profile_id: 'u2' },
      { day: '2026-10-07', profile_id: 'u1' },
      { day: '2026-10-07', profile_id: 'u2' },
    ];
    // Today incomplete, but streak from yesterday is 2 days
    expect(calculateStreak(answers, 2, refDate)).toBe(2);
  });

  it('stops at first missed day in consecutive history', () => {
    const answers: DailyAnswerRow[] = [
      { day: '2026-10-09', profile_id: 'u1' },
      { day: '2026-10-09', profile_id: 'u2' },
      { day: '2026-10-08', profile_id: 'u1' },
      { day: '2026-10-08', profile_id: 'u2' },
      // 2026-10-07 missing!
      { day: '2026-10-06', profile_id: 'u1' },
      { day: '2026-10-06', profile_id: 'u2' },
    ];
    // 10-09 + 10-08 = 2 days
    expect(calculateStreak(answers, 2, refDate)).toBe(2);
  });

  it('handles Vietnam midnight correctly (UTC 17:30 is next day 00:30 VN)', () => {
    // 2026-10-09 17:30 UTC = 2026-10-10 00:30 VN
    const pastMidnightDate = new Date('2026-10-09T17:30:00Z');

    const answers: DailyAnswerRow[] = [
      { day: '2026-10-09', profile_id: 'u1' },
      { day: '2026-10-09', profile_id: 'u2' },
      { day: '2026-10-08', profile_id: 'u1' },
      { day: '2026-10-08', profile_id: 'u2' },
    ];

    // For VN time it is now 2026-10-10. Today (10-10) is incomplete. Yesterday (10-09) is complete.
    // Streak from yesterday should be 2.
    expect(calculateStreak(answers, 2, pastMidnightDate)).toBe(2);
  });
});
