import { describe, it, expect } from 'vitest';
import { VIETNAM_TIMEZONE, todayVN, startOfDayVN, formatVN, toVN } from './time';

describe('lib/time (Vietnam Timezone Utilities)', () => {
  it('uses Asia/Ho_Chi_Minh as default timezone', () => {
    expect(VIETNAM_TIMEZONE).toBe('Asia/Ho_Chi_Minh');
  });

  it('formats current date matching YYYY-MM-DD pattern', () => {
    const today = todayVN();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('correctly shifts UTC timestamp across the midnight boundary in Vietnam (+7)', () => {
    // 2026-05-10 18:30 UTC is 2026-05-11 01:30 in Vietnam (UTC+7)
    const utcIso = '2026-05-10T18:30:00Z';
    const formatted = formatVN(utcIso, 'yyyy-MM-dd HH:mm');
    expect(formatted).toBe('2026-05-11 01:30');
  });

  it('computes start of day correctly in Vietnam timezone', () => {
    // 2026-05-10 18:30 UTC is 2026-05-11 in VN
    const utcIso = '2026-05-10T18:30:00Z';
    const startOfDay = startOfDayVN(utcIso);
    const formatted = formatVN(startOfDay, 'yyyy-MM-dd HH:mm:ss');
    expect(formatted).toBe('2026-05-11 00:00:00');
  });

  it('handles Date objects and numeric timestamps', () => {
    const date = new Date('2026-01-01T00:00:00Z');
    const vnDate = toVN(date);
    expect(vnDate).toBeDefined();
    expect(formatVN(date.getTime(), 'yyyy-MM-dd')).toBe('2026-01-01');
  });
});
