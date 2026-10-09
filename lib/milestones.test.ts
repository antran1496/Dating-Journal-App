import { describe, it, expect } from 'vitest';
import {
  parseLocalDate,
  getNextMilestones,
  getTodayMilestone,
  getUpcomingMilestones,
  calculateMilestoneProgress,
  type CoupleMemberWithProfile,
} from './milestones';

describe('lib/milestones', () => {
  const referenceDate = new Date(2026, 9, 9); // 2026-10-09

  it('parses YYYY-MM-DD string correctly as local start of day', () => {
    const d = parseLocalDate('2025-08-22');
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(7); // 0-indexed: 7 is August
    expect(d.getDate()).toBe(22);
  });

  it('calculates day milestones and anniversary correctly', () => {
    // 2025-08-22 to 2026-10-09 is 413 days passed => Day 414
    const anniversary = parseLocalDate('2025-08-22');
    const milestones = getNextMilestones(anniversary, [], undefined, referenceDate);

    // Next day milestone should be 500 days
    expect(milestones.length).toBeGreaterThan(0);
    const day500 = milestones.find((m) => m.label === '500 ngày');
    expect(day500).toBeDefined();
    expect(day500?.type).toBe('days');
    expect(day500?.daysUntil).toBe(86); // 500 - 414 = 86
  });

  it('includes partner birthday in milestones', () => {
    const anniversary = parseLocalDate('2025-08-22');
    const members: CoupleMemberWithProfile[] = [
      {
        couple_id: 'c1',
        profile_id: 'user-1',
        role: 'owner',
        nickname: 'Minh Anh',
        profile: {
          id: 'user-1',
          display_name: 'Minh Anh',
          avatar_url: null,
          birth_date: '1998-01-01',
          created_at: '',
        },
      },
      {
        couple_id: 'c1',
        profile_id: 'partner-2',
        role: 'member',
        nickname: 'Gấu',
        profile: {
          id: 'partner-2',
          display_name: 'Quốc Huy',
          avatar_url: null,
          birth_date: '1997-10-25', // 16 days after 2026-10-09
          created_at: '',
        },
      },
    ];

    const milestones = getNextMilestones(anniversary, members, 'user-1', referenceDate);

    // Partner's birthday is in 16 days, so it should be the closest milestone
    expect(milestones[0].label).toBe('🎂 Sinh nhật Gấu');
    expect(milestones[0].daysUntil).toBe(16);
    expect(milestones[0].type).toBe('birthday');
  });

  it('handles birthday that already passed earlier in the current year', () => {
    const members: CoupleMemberWithProfile[] = [
      {
        couple_id: 'c1',
        profile_id: 'partner-2',
        role: 'member',
        nickname: null,
        profile: {
          id: 'partner-2',
          display_name: 'Quốc Huy',
          avatar_url: null,
          birth_date: '1997-03-10', // Already passed in 2026
          created_at: '',
        },
      },
    ];

    const milestones = getNextMilestones(null, members, 'user-1', referenceDate);
    expect(milestones.length).toBe(1);
    expect(milestones[0].label).toBe('🎂 Sinh nhật Quốc Huy');
    expect(milestones[0].date.getFullYear()).toBe(2027);
  });

  it('detects today milestone and upcoming alerts', () => {
    const anniversary = parseLocalDate('2026-10-09'); // Today is anniversary (0 days until)
    const milestones = getNextMilestones(anniversary, [], undefined, referenceDate);

    const todayM = getTodayMilestone(milestones);
    expect(todayM).toBeNull(); // Day 100 is in future

    // If milestone is 5 days away
    const upcoming = getUpcomingMilestones(
      [
        { label: 'Test 1', date: new Date(), daysUntil: 3, type: 'days' },
        { label: 'Test 2', date: new Date(), daysUntil: 10, type: 'days' },
      ],
      7
    );
    expect(upcoming.length).toBe(1);
    expect(upcoming[0].label).toBe('Test 1');
  });

  it('calculates progress accurately', () => {
    // 500 days milestone when current day is 414: previous milestone was 365
    // span = 500 - 365 = 135; elapsed = 414 - 365 = 49; 49 / 135 ≈ 36%
    const progress = calculateMilestoneProgress(
      { label: '500 ngày', date: new Date(), daysUntil: 86, type: 'days', targetDays: 500 },
      414
    );
    expect(progress).toBe(36);
  });
});
