import { describe, it, expect } from 'vitest';
import { calculateSpendingStats, generateSpendingCsv, getVnDateParts } from './spending';
import type { DateEntry } from '@/types';

describe('lib/spending', () => {
  it('correctly parses VN timezone boundary for date components', () => {
    // 2026-04-30T17:30:00.000Z is 2026-05-01 00:30:00 in Asia/Ho_Chi_Minh (UTC+7)
    const utcDate = '2026-04-30T17:30:00.000Z';
    const parts = getVnDateParts(utcDate);

    expect(parts.year).toBe(2026);
    expect(parts.month).toBe(5);
    expect(parts.day).toBe(1);
    expect(parts.monthStr).toBe('2026-05');
  });

  it('calculates spending stats with weekly buckets and max item correctly', () => {
    const mockDates: Partial<DateEntry>[] = [
      {
        id: '1',
        title: 'Cà phê sáng',
        date_time: '2026-05-02T10:00:00+07:00', // Week 1 (day 2)
        spend_vnd: 85000,
        mood: 'happy',
        location_name: 'The Workshop Coffee',
      },
      {
        id: '2',
        title: 'Xem phim cuối tuần',
        date_time: '2026-05-10T19:00:00+07:00', // Week 2 (day 10)
        spend_vnd: 350000,
        mood: 'excited',
        location_name: 'CGV Vincom',
      },
      {
        id: '3',
        title: 'Ăn tối lãng mạn',
        date_time: '2026-05-20T19:30:00+07:00', // Week 3 (day 20)
        spend_vnd: 1200000,
        mood: 'love',
        location_name: 'Pizza 4P',
      },
      {
        id: '4',
        title: 'Trà chiều',
        date_time: '2026-05-25T15:00:00+07:00', // Week 4 (day 25)
        spend_vnd: 150000,
        mood: 'calm',
        location_name: 'The Workshop Coffee',
      },
      {
        id: '5',
        title: 'Dạo phố & ăn kem',
        date_time: '2026-05-30T20:00:00+07:00', // Week 5 (day 30)
        spend_vnd: 90000,
        mood: 'happy',
        location_name: 'Phố đi bộ',
      },
      {
        id: '6',
        title: 'Buổi hẹn tháng 4',
        date_time: '2026-04-20T10:00:00+07:00', // Different month
        spend_vnd: 500000,
        mood: 'happy',
      },
      {
        id: '7',
        title: 'Không có chi tiêu',
        date_time: '2026-05-12T10:00:00+07:00',
        spend_vnd: 0,
      },
    ];

    const stats = calculateSpendingStats(
      mockDates as DateEntry[],
      '2026-05',
      2000000 // 2,000,000 budget
    );

    expect(stats.count).toBe(5);
    expect(stats.total).toBe(85000 + 350000 + 1200000 + 150000 + 90000); // 1,875,000
    expect(stats.avgPerDate).toBe(Math.round(1875000 / 5)); // 375,000
    expect(stats.maxItem).toEqual({
      id: '3',
      title: 'Ăn tối lãng mạn',
      spendVnd: 1200000,
    });

    // Check weekly distribution
    expect(stats.weekly[0].total).toBe(85000);
    expect(stats.weekly[1].total).toBe(350000);
    expect(stats.weekly[2].total).toBe(1200000);
    expect(stats.weekly[3].total).toBe(150000);
    expect(stats.weekly[4].total).toBe(90000);

    // Check mood breakdown
    expect(stats.byMood['love']).toBe(1200000);
    expect(stats.byMood['happy']).toBe(175000);

    // Check location breakdown
    expect(stats.byLocation['The Workshop Coffee']).toBe(235000);

    // Check budget
    expect(stats.budgetVnd).toBe(2000000);
    expect(stats.budgetProgress).toBe(Math.round((1875000 / 2000000) * 100)); // 94%
    expect(stats.isOverBudget).toBe(false);
  });

  it('detects over budget condition', () => {
    const mockDates: Partial<DateEntry>[] = [
      {
        id: '1',
        title: 'Chuyến đi xa',
        date_time: '2026-06-05T10:00:00+07:00',
        spend_vnd: 3500000,
      },
    ];

    const stats = calculateSpendingStats(
      mockDates as DateEntry[],
      '2026-06',
      3000000
    );

    expect(stats.isOverBudget).toBe(true);
    expect(stats.budgetProgress).toBe(117);
  });

  it('generates UTF-8 BOM CSV with properly escaped columns', () => {
    const mockDates: Partial<DateEntry>[] = [
      {
        id: '1',
        title: 'Cà phê "đặc biệt", ngắm mưa',
        date_time: '2026-05-02T10:00:00+07:00',
        spend_vnd: 95000,
        mood: 'calm',
        location_name: 'Quận 1',
        note: 'Có chút mưa bay, rất thơm.',
        created_by: 'user-1',
      },
    ];

    const csv = generateSpendingCsv(mockDates as DateEntry[], {
      'user-1': 'Minh Anh',
    });

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Cà phê ""đặc biệt"", ngắm mưa"');
    expect(csv).toContain('"Minh Anh"');
    expect(csv).toContain('95000');
    expect(csv).toContain('"Có chút mưa bay, rất thơm."');
  });
});
