import { todayVN } from '@/lib/time';

/**
 * Validates that the requested unlock date is at least tomorrow in Vietnam timezone,
 * and within 10 years into the future.
 */
export function isUnlockDateValid(unlockOn: string, referenceToday: string = todayVN()): {
  valid: boolean;
  error?: string;
} {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(unlockOn)) {
    return { valid: false, error: 'Định dạng ngày không hợp lệ (cần YYYY-MM-DD)' };
  }

  if (unlockOn <= referenceToday) {
    return { valid: false, error: 'Ngày mở khóa phải từ ngày mai trở đi' };
  }

  const [refY, refM, refD] = referenceToday.split('-').map(Number);
  const maxYearDate = `${refY + 10}-${String(refM).padStart(2, '0')}-${String(refD).padStart(2, '0')}`;

  if (unlockOn > maxYearDate) {
    return { valid: false, error: 'Ngày mở khóa không được quá 10 năm trong tương lai' };
  }

  return { valid: true };
}
