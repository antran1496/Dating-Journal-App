'use client';

import React from 'react';
import { Plus, Calendar } from 'lucide-react';
import Link from 'next/link';
import { CoupleCounter } from '@/components/features/couple-counter';
import { MonthlyCalendar } from '@/components/features/monthly-calendar';
import { MilestoneCelebration } from '@/components/features/milestone-celebration';
import { MilestoneBanner } from '@/components/features/milestone-banner';
import { useCouple } from '@/hooks/use-couple';

export default function DashboardPage() {
  const { couple, isLoading: isLoadingCouple } = useCouple();

  if (isLoadingCouple) {
    return <div className="p-8 text-center text-text-muted">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-8">
      <MilestoneCelebration />
      <MilestoneBanner />

      <header>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-text">Tổng quan 💕</h1>
        <p className="text-text-muted text-sm mt-1">Câu chuyện tình yêu của bạn hôm nay</p>
      </header>

      {/* Couple Counter — Client Component */}
      <CoupleCounter />

      {/* Monthly Calendar — Client Component */}
      <MonthlyCalendar />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/dates/new"
          className="group flex items-center gap-4 p-4 rounded-[var(--radius-lg)] bg-surface border border-border hover:border-primary/40 hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={22} />
          </div>
          <div>
            <p className="font-semibold text-text">Ghi buổi hẹn mới</p>
            <p className="text-text-muted text-xs">Lưu lại kỷ niệm hôm nay</p>
          </div>
        </Link>

        <Link
          href="/dates"
          className="group flex items-center gap-4 p-4 rounded-[var(--radius-lg)] bg-surface border border-border hover:border-accent/40 hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calendar size={22} />
          </div>
          <div>
            <p className="font-semibold text-text">Xem tất cả buổi hẹn</p>
            <p className="text-text-muted text-xs">Nhìn lại hành trình yêu</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

