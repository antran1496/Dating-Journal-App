'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle,
  Wallet,
  TrendingUp,
  CreditCard,
  Calendar,
  Sparkles,
  MapPin,
  Smile,
  Check,
} from 'lucide-react';
import { useSpending, useUpdateBudget } from '@/hooks/use-spending';
import { generateSpendingCsv, getVnDateParts } from '@/lib/spending';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

const MOOD_MAP: Record<string, { label: string; icon: string }> = {
  love: { label: 'Ngọt ngào', icon: '💗' },
  happy: { label: 'Vui vẻ', icon: '😊' },
  calm: { label: 'Bình yên', icon: '🌿' },
  excited: { label: 'Hào hứng', icon: '✨' },
  tired: { label: 'Mệt mỏi', icon: '🥱' },
  sad: { label: 'Buồn', icon: '🥺' },
};

export default function SpendingPage() {
  const now = getVnDateParts(new Date());
  const [selectedMonth, setSelectedMonth] = useState<string>(now.monthStr);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState<string>('');

  const { data, isLoading } = useSpending(selectedMonth);
  const updateBudgetMutation = useUpdateBudget();

  const stats = data?.data;
  const authorNames = data?.authorNames || {};

  // Handlers for month navigation
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    const parts = getVnDateParts(date);
    setSelectedMonth(parts.monthStr);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    const parts = getVnDateParts(date);
    setSelectedMonth(parts.monthStr);
  };

  const handleSaveBudget = async () => {
    const val = budgetInput.trim() ? parseInt(budgetInput.replace(/\D/g, ''), 10) : null;
    await updateBudgetMutation.mutateAsync(val);
    setIsEditingBudget(false);
  };

  const handleExportCsv = () => {
    if (!stats?.rows) return;
    const csvContent = generateSpendingCsv(stats.rows, authorNames);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `chi-tieu-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [yearStr, monthStr] = selectedMonth.split('-');
  const monthDisplayTitle = `Tháng ${monthStr}/${yearStr}`;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <LoadingSkeleton variant="rect" height="40px" width="220px" className="rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LoadingSkeleton variant="rect" height="110px" className="rounded-xl" />
          <LoadingSkeleton variant="rect" height="110px" className="rounded-xl" />
          <LoadingSkeleton variant="rect" height="110px" className="rounded-xl" />
        </div>
        <LoadingSkeleton variant="rect" height="260px" className="rounded-xl" />
      </div>
    );
  }

  const total = stats?.total || 0;
  const avg = stats?.avgPerDate || 0;
  const maxItem = stats?.maxItem;
  const budget = stats?.budgetVnd || null;
  const progress = stats?.budgetProgress || 0;
  const isOver = stats?.isOverBudget || false;
  const weekly = stats?.weekly || [];
  const rows = stats?.rows || [];
  const maxWeekly = Math.max(...weekly.map((w) => w.total), 1);

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-12">
      {/* 1. Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text flex items-center gap-2">
            <span>💸</span> Chi tiêu tình yêu
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Theo dõi chi tiêu chung cho các buổi hẹn. Chỉ nhập khi bạn muốn, không bắt buộc.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-surface border border-border rounded-full p-1 shadow-xs">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-full hover:bg-surface-hover text-text-muted hover:text-text transition-colors cursor-pointer"
            aria-label="Tháng trước"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="px-3 font-semibold text-sm text-text min-w-[110px] text-center">
            {monthDisplayTitle}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-full hover:bg-surface-hover text-text-muted hover:text-text transition-colors cursor-pointer"
            aria-label="Tháng sau"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* 2. Three Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted text-xs font-medium">
            <span>Tổng chi trong tháng</span>
            <Wallet size={16} className="text-primary" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-text">
              {new Intl.NumberFormat('vi-VN').format(total)}đ
            </span>
            <p className="text-xs text-text-muted mt-1">{rows.length} buổi hẹn có chi tiêu</p>
          </div>
        </div>

        <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted text-xs font-medium">
            <span>Trung bình mỗi buổi</span>
            <TrendingUp size={16} className="text-blue-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-text">
              {new Intl.NumberFormat('vi-VN').format(avg)}đ
            </span>
            <p className="text-xs text-text-muted mt-1">trên mỗi buổi ghi nhận</p>
          </div>
        </div>

        <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted text-xs font-medium">
            <span>Tiêu nhiều nhất</span>
            <CreditCard size={16} className="text-amber-500" />
          </div>
          <div className="mt-3">
            {maxItem ? (
              <>
                <span className="text-xl sm:text-2xl font-bold text-text truncate block" title={maxItem.title}>
                  {new Intl.NumberFormat('vi-VN').format(maxItem.spendVnd)}đ
                </span>
                <p className="text-xs text-text-muted mt-1 truncate" title={maxItem.title}>
                  {maxItem.title}
                </p>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-text">—</span>
                <p className="text-xs text-text-muted mt-1">Chưa có khoản chi</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Monthly Budget Section */}
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-bold text-text">
              Hạn mức ngân sách tháng
            </h3>
            {isOver && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>Vượt ngân sách</span>
              </span>
            )}
          </div>

          {!isEditingBudget ? (
            <button
              type="button"
              onClick={() => {
                setBudgetInput(budget ? String(budget) : '');
                setIsEditingBudget(true);
              }}
              className="text-xs text-primary font-semibold hover:underline self-start sm:self-auto cursor-pointer"
            >
              {budget ? 'Thay đổi ngân sách' : '+ Đặt hạn mức'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Ví dụ: 3000000"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-36 px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleSaveBudget}
                disabled={updateBudgetMutation.isPending}
                className="px-2.5 py-1 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90 flex items-center gap-1 cursor-pointer"
              >
                <Check size={12} />
                <span>Lưu</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingBudget(false)}
                className="px-2.5 py-1 bg-surface-hover text-text-muted text-xs font-medium rounded-lg hover:text-text cursor-pointer"
              >
                Huỷ
              </button>
            </div>
          )}
        </div>

        {budget ? (
          <div className="space-y-2">
            <div className="w-full h-3 bg-surface-hover rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isOver
                    ? 'bg-amber-500'
                    : progress > 80
                    ? 'bg-amber-400'
                    : 'bg-primary'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>
                Đã chi <strong>{new Intl.NumberFormat('vi-VN').format(total)}đ</strong> /{' '}
                {new Intl.NumberFormat('vi-VN').format(budget)}đ ({progress}%)
              </span>
              <span>
                {isOver
                  ? `Vượt ${new Intl.NumberFormat('vi-VN').format(total - budget)}đ`
                  : `Còn lại ${new Intl.NumberFormat('vi-VN').format(budget - total)}đ`}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-muted">
            Đặt ngân sách để cùng theo dõi tiến độ chi tiêu theo thời gian thực.
          </p>
        )}
      </div>

      {/* 4. Weekly Bar Chart (SVG Inline) */}
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-heading text-base font-bold text-text">
          Chi tiêu theo tuần
        </h3>

        <div className="pt-2">
          <div className="grid grid-cols-5 gap-2 sm:gap-4 items-end h-44 border-b border-border pb-2">
            {weekly.map((w) => {
              const heightPercent = maxWeekly > 0 ? Math.round((w.total / maxWeekly) * 100) : 0;
              const barHeight = Math.max(heightPercent, w.total > 0 ? 6 : 2);

              return (
                <div key={w.week} className="flex flex-col items-center justify-end h-full group">
                  <span className="text-[10px] sm:text-xs font-medium text-text-muted group-hover:text-primary transition-colors mb-1 text-center truncate w-full">
                    {w.total > 0 ? `${Math.round(w.total / 1000)}k` : '0đ'}
                  </span>
                  <div className="w-full max-w-[48px] bg-surface-hover/70 rounded-t-md h-full flex items-end">
                    <div
                      className="w-full bg-primary/80 hover:bg-primary transition-all duration-300 rounded-t-md"
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-text mt-2 text-center">
                    T{w.week}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-text-muted text-center mt-2">
            T1 (1–7) · T2 (8–14) · T3 (15–21) · T4 (22–28) · T5 (29+)
          </p>
        </div>
      </div>

      {/* 5. Advanced Breakdown: Mood & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Mood */}
        <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs space-y-3">
          <h3 className="font-heading text-sm sm:text-base font-bold text-text flex items-center gap-1.5">
            <Smile size={16} className="text-primary" />
            <span>Chi tiêu theo cảm xúc</span>
          </h3>

          {Object.keys(stats?.byMood || {}).length === 0 ? (
            <p className="text-xs text-text-muted py-4 text-center">Chưa có dữ liệu cảm xúc.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(stats?.byMood || {}).map(([moodKey, spend]) => {
                const info = MOOD_MAP[moodKey] || { label: moodKey, icon: '✨' };
                const percent = total > 0 ? Math.round((spend / total) * 100) : 0;
                return (
                  <div key={moodKey} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text flex items-center gap-1">
                        <span>{info.icon}</span>
                        <span>{info.label}</span>
                      </span>
                      <span className="font-semibold text-text">
                        {new Intl.NumberFormat('vi-VN').format(spend)}đ ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By Location */}
        <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs space-y-3">
          <h3 className="font-heading text-sm sm:text-base font-bold text-text flex items-center gap-1.5">
            <MapPin size={16} className="text-blue-500" />
            <span>Địa điểm chi tiêu nhiều</span>
          </h3>

          {Object.keys(stats?.byLocation || {}).length === 0 ? (
            <p className="text-xs text-text-muted py-4 text-center">Chưa có dữ liệu địa điểm.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(stats?.byLocation || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([locName, spend]) => {
                  const percent = total > 0 ? Math.round((spend / total) * 100) : 0;
                  return (
                    <div key={locName} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text truncate max-w-[65%]" title={locName}>
                          {locName}
                        </span>
                        <span className="font-semibold text-text">
                          {new Intl.NumberFormat('vi-VN').format(spend)}đ
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* 6. Date Entries Table & Export CSV */}
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-heading text-base font-bold text-text">
              Các buổi hẹn có chi tiêu
            </h3>
            <p className="text-xs text-text-muted">
              Danh sách chi tiết các buổi hẹn trong {monthDisplayTitle.toLowerCase()}.
            </p>
          </div>

          {rows.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-hover/50 hover:bg-surface-hover text-text text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Download size={14} />
              <span>Xuất báo cáo (CSV)</span>
            </button>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="py-8 text-center text-text-muted text-xs border border-dashed border-border rounded-xl">
            Không có khoản chi nào trong tháng này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Buổi hẹn</th>
                  <th className="py-2.5 px-3">Ngày</th>
                  <th className="py-2.5 px-3">Ai ghi</th>
                  <th className="py-2.5 px-3 text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((r) => {
                  const parts = r.date_time ? getVnDateParts(r.date_time) : null;
                  const dateStr = parts ? `${parts.day}/${parts.month}` : '';
                  const author = (r.created_by && authorNames[r.created_by]) || 'Người ấy';

                  return (
                    <tr key={r.id} className="hover:bg-surface-hover/30 transition-colors">
                      <td className="py-3 px-3 font-medium text-text">
                        <Link href={`/dates/${r.id}`} className="hover:text-primary hover:underline">
                          {r.title || 'Buổi hẹn'}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-text-muted">{dateStr}</td>
                      <td className="py-3 px-3 text-text-muted">{author}</td>
                      <td className="py-3 px-3 text-right font-bold text-text">
                        {new Intl.NumberFormat('vi-VN').format(r.spend_vnd || 0)}đ
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
