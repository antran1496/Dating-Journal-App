import type { DateEntry } from '@/types';

export interface WeeklySpending {
  week: number;
  label: string;
  total: number;
}

export interface SpendingStats {
  month: string;
  total: number;
  count: number;
  avgPerDate: number;
  maxItem: {
    id: string;
    title: string;
    spendVnd: number;
  } | null;
  weekly: WeeklySpending[];
  byMood: Record<string, number>;
  byLocation: Record<string, number>;
  budgetVnd: number | null;
  budgetProgress: number; // 0 to 100+
  isOverBudget: boolean;
  rows: DateEntry[];
}

/**
 * Parses date into Vietnam local components (year, month 1-12, day 1-31)
 */
export function getVnDateParts(isoOrDate: string | Date): {
  year: number;
  month: number;
  day: number;
  monthStr: string; // YYYY-MM
} {
  const dateObj = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const formatted = formatter.format(dateObj); // YYYY-MM-DD
  const [y, m, d] = formatted.split('-').map(Number);
  return {
    year: y,
    month: m,
    day: d,
    monthStr: `${y}-${String(m).padStart(2, '0')}`,
  };
}

/**
 * Calculates spending statistics for a specific YYYY-MM month in Vietnam timezone.
 */
export function calculateSpendingStats(
  dates: DateEntry[],
  targetMonth: string, // YYYY-MM
  budgetVnd: number | null = null
): SpendingStats {
  const monthRows = dates.filter((d) => {
    const rawDate = d.date_time || d.created_at;
    if (!rawDate) return false;
    const parts = getVnDateParts(rawDate);
    return parts.monthStr === targetMonth && typeof d.spend_vnd === 'number' && d.spend_vnd > 0;
  });

  let total = 0;
  let maxItem: SpendingStats['maxItem'] = null;
  const weeklyTotals = [0, 0, 0, 0, 0];
  const byMood: Record<string, number> = {};
  const byLocation: Record<string, number> = {};

  for (const row of monthRows) {
    const spend = row.spend_vnd || 0;
    total += spend;

    // Max item
    if (!maxItem || spend > maxItem.spendVnd) {
      maxItem = {
        id: row.id,
        title: row.title || 'Buổi hẹn',
        spendVnd: spend,
      };
    }

    // Weekly breakdown
    const parts = getVnDateParts(row.date_time || row.created_at);
    const day = parts.day;
    let weekIdx = 0;
    if (day <= 7) weekIdx = 0;
    else if (day <= 14) weekIdx = 1;
    else if (day <= 21) weekIdx = 2;
    else if (day <= 28) weekIdx = 3;
    else weekIdx = 4;

    weeklyTotals[weekIdx] += spend;

    // By Mood
    if (row.mood) {
      byMood[row.mood] = (byMood[row.mood] || 0) + spend;
    }

    // By Location
    const place = row.places && row.places.length > 0 ? row.places[0].name : row.location_name;
    const locName = place?.trim() || 'Chưa ghi địa điểm';
    byLocation[locName] = (byLocation[locName] || 0) + spend;
  }

  const count = monthRows.length;
  const avgPerDate = count > 0 ? Math.round(total / count) : 0;

  const weekly: WeeklySpending[] = [
    { week: 1, label: 'Tuần 1 (1–7)', total: weeklyTotals[0] },
    { week: 2, label: 'Tuần 2 (8–14)', total: weeklyTotals[1] },
    { week: 3, label: 'Tuần 3 (15–21)', total: weeklyTotals[2] },
    { week: 4, label: 'Tuần 4 (22–28)', total: weeklyTotals[3] },
    { week: 5, label: 'Tuần 5 (29+)', total: weeklyTotals[4] },
  ];

  const budget = budgetVnd && budgetVnd > 0 ? budgetVnd : null;
  const budgetProgress = budget ? Math.round((total / budget) * 100) : 0;
  const isOverBudget = budget ? total > budget : false;

  return {
    month: targetMonth,
    total,
    count,
    avgPerDate,
    maxItem,
    weekly,
    byMood,
    byLocation,
    budgetVnd: budget,
    budgetProgress,
    isOverBudget,
    rows: monthRows,
  };
}

/**
 * Generates CSV string with UTF-8 BOM so Excel opens Vietnamese characters cleanly.
 */
export function generateSpendingCsv(
  rows: DateEntry[],
  authorNames: Record<string, string> = {}
): string {
  const BOM = '\uFEFF';
  const headers = ['Buổi hẹn', 'Ngày', 'Ai ghi', 'Địa điểm', 'Tâm trạng', 'Số tiền (VNĐ)', 'Ghi chú'];
  
  const escapeCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvRows = [headers.join(',')];

  for (const r of rows) {
    const rawDate = r.date_time || r.created_at;
    const parts = rawDate ? getVnDateParts(rawDate) : null;
    const dateFormatted = parts ? `${String(parts.day).padStart(2, '0')}/${String(parts.month).padStart(2, '0')}/${parts.year}` : '';
    const author = (r.created_by && authorNames[r.created_by]) || 'Người ấy';
    const place = r.places && r.places.length > 0 ? r.places[0].name : r.location_name;

    csvRows.push(
      [
        escapeCell(r.title || 'Buổi hẹn'),
        escapeCell(dateFormatted),
        escapeCell(author),
        escapeCell(place || ''),
        escapeCell(r.mood || ''),
        escapeCell(r.spend_vnd || 0),
        escapeCell(r.note || ''),
      ].join(',')
    );
  }

  return BOM + csvRows.join('\r\n');
}
