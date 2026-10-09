import { describe, it, expect } from 'vitest';
import { isUnlockDateValid } from './date';

describe('lib/capsules/date (Unlock date validation)', () => {
  const mockToday = '2026-10-09';

  it('rejects dates in the past or today', () => {
    expect(isUnlockDateValid('2026-10-08', mockToday).valid).toBe(false);
    expect(isUnlockDateValid('2026-10-09', mockToday).valid).toBe(false);
  });

  it('accepts tomorrow and future dates within 10 years', () => {
    expect(isUnlockDateValid('2026-10-10', mockToday).valid).toBe(true);
    expect(isUnlockDateValid('2027-10-09', mockToday).valid).toBe(true);
    expect(isUnlockDateValid('2036-10-09', mockToday).valid).toBe(true);
  });

  it('rejects dates further than 10 years in the future', () => {
    expect(isUnlockDateValid('2036-10-10', mockToday).valid).toBe(false);
    expect(isUnlockDateValid('2040-01-01', mockToday).valid).toBe(false);
  });

  it('rejects invalid date formats', () => {
    expect(isUnlockDateValid('invalid-date', mockToday).valid).toBe(false);
    expect(isUnlockDateValid('09/10/2026', mockToday).valid).toBe(false);
  });
});
