import { describe, it, expect } from 'vitest';
import { isQuietHours } from './send';

describe('lib/push/send (isQuietHours)', () => {
  it('returns false when quiet_enabled is false', () => {
    const prefs = {
      quiet_enabled: false,
      quiet_start: '22:00',
      quiet_end: '07:00',
    };
    // 23:00 VN time (16:00 UTC)
    const testDate = new Date('2026-05-10T16:00:00.000Z');
    expect(isQuietHours(prefs, testDate)).toBe(false);
  });

  it('correctly detects overnight quiet hours window (22:00 - 07:00)', () => {
    const prefs = {
      quiet_enabled: true,
      quiet_start: '22:00',
      quiet_end: '07:00',
    };

    // 23:30 VN time (16:30 UTC) -> should be quiet
    const lateNight = new Date('2026-05-10T16:30:00.000Z');
    expect(isQuietHours(prefs, lateNight)).toBe(true);

    // 05:45 VN time (22:45 UTC prev day) -> should be quiet
    const earlyMorning = new Date('2026-05-10T22:45:00.000Z');
    expect(isQuietHours(prefs, earlyMorning)).toBe(true);

    // 14:00 VN time (07:00 UTC) -> should NOT be quiet
    const afternoon = new Date('2026-05-10T07:00:00.000Z');
    expect(isQuietHours(prefs, afternoon)).toBe(false);

    // 21:55 VN time (14:55 UTC) -> should NOT be quiet (before 22:00)
    const evening = new Date('2026-05-10T14:55:00.000Z');
    expect(isQuietHours(prefs, evening)).toBe(false);
  });

  it('correctly detects daytime window (13:00 - 15:00)', () => {
    const prefs = {
      quiet_enabled: true,
      quiet_start: '13:00',
      quiet_end: '15:00',
    };

    // 13:30 VN time (06:30 UTC) -> should be quiet
    const siesta = new Date('2026-05-10T06:30:00.000Z');
    expect(isQuietHours(prefs, siesta)).toBe(true);

    // 16:00 VN time (09:00 UTC) -> should NOT be quiet
    const postSiesta = new Date('2026-05-10T09:00:00.000Z');
    expect(isQuietHours(prefs, postSiesta)).toBe(false);
  });
});
