'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, Plus } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { useCouple } from '@/hooks/use-couple';
import { useOnThisDay } from '@/hooks/use-dates';
import { DateCard } from '@/components/features/date-card';
import type { DateEntry } from '@/types';

export default function OnThisDayPage() {
  const { couple, isLoading: isLoadingCouple } = useCouple();
  const { data: dates, isLoading: isLoadingDates } = useOnThisDay(couple?.id);

  if (isLoadingCouple || isLoadingDates) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-text-muted">
        Đang tìm lại những kỷ niệm ngày này năm xưa...
      </div>
    );
  }

  const todayStr = new Intl.DateTimeFormat('vi-VN', {
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const currentYear = new Date().getFullYear();

  // Group dates by years ago
  const groupedByYear: Record<number, DateEntry[]> = {};
  if (dates) {
    for (const d of dates) {
      const dYear = new Date(d.date_time ?? d.created_at).getFullYear();
      const diff = currentYear - dYear;
      if (!groupedByYear[diff]) {
        groupedByYear[diff] = [];
      }
      groupedByYear[diff].push(d);
    }
  }

  const sortedYearDiffs = Object.keys(groupedByYear)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton fallback="/dates" forceFallback className="p-2 rounded-[var(--radius-md)] hover:bg-surface-hover" />
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-text flex items-center gap-2">
              <span>Ngày này năm xưa</span>
              <Sparkles size={20} className="text-primary" />
            </h1>
            <p className="text-text-muted text-xs sm:text-sm">
              Những khoảnh khắc vào ngày {todayStr}
            </p>
          </div>
        </div>

        <Link
          href="/dates/new"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-md)] bg-primary text-primary-fg text-xs sm:text-sm font-medium hover:opacity-90 shadow-sm"
        >
          <Plus size={16} /> Ghi mới
        </Link>
      </div>

      {/* Content */}
      {sortedYearDiffs.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-[var(--radius-lg)] bg-surface border border-border space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl">
            ✨
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-text text-base">
              Chưa có kỷ niệm nào vào ngày này
            </h3>
            <p className="text-text-muted text-sm max-w-sm mx-auto">
              Hôm nay hãy cùng nhau tạo nên một kỷ niệm mới để năm sau nhìn lại nhé!
            </p>
          </div>
          <Link
            href="/dates/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-primary text-primary-fg text-sm font-semibold hover:opacity-90 shadow-sm transition-opacity"
          >
            <Plus size={16} /> Ghi kỷ niệm hôm nay 💕
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedYearDiffs.map((diff) => {
            const yearDates = groupedByYear[diff];
            const targetYear = currentYear - diff;

            return (
              <div key={diff} className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                  <Calendar size={16} className="text-primary" />
                  <h2 className="font-heading font-semibold text-text text-base">
                    {diff === 1 ? '1 năm trước' : `${diff} năm trước`} ({targetYear})
                  </h2>
                  <span className="text-xs text-text-muted">({yearDates.length} kỷ niệm)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {yearDates.map((item) => (
                    <DateCard key={item.id} date={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
