'use client';

import React from 'react';
import { CoupleCounter } from '@/components/features/couple-counter';
import { DailyQuestionWidget } from '@/components/features/daily-question-widget';
import { MonthlyCalendar } from '@/components/features/monthly-calendar';
import { OnThisDayWidget } from '@/components/features/on-this-day-widget';
import { UpcomingMilestones } from '@/components/features/upcoming-milestones';
import { RecentDates } from '@/components/features/recent-dates';
import { WishlistWidget } from '@/components/features/wishlist-widget';
import { SpendingWidget } from '@/components/features/spending-widget';
import { MilestoneCelebration } from '@/components/features/milestone-celebration';
import { MilestoneBanner } from '@/components/features/milestone-banner';
import { useCouple } from '@/hooks/use-couple';
import { useSessionUser } from '@/components/providers/session-provider';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function DashboardPage() {
  const { user } = useSessionUser();
  const { couple, isLoading: isLoadingCouple } = useCouple();

  if (isLoadingCouple) {
    return (
      <div className="space-y-6 animate-pulse">
        <LoadingSkeleton variant="rect" height="60px" className="rounded-[var(--radius-lg)]" />
        <div className="flex items-center justify-between">
          <LoadingSkeleton variant="text" width="220px" height="32px" />
          <LoadingSkeleton variant="rect" width="110px" height="40px" className="rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7">
            <LoadingSkeleton variant="rect" height="260px" className="rounded-[var(--radius-xl)]" />
          </div>
          <div className="md:col-span-5">
            <LoadingSkeleton variant="rect" height="260px" className="rounded-[var(--radius-xl)]" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <LoadingSkeleton variant="rect" height="380px" className="rounded-[var(--radius-xl)]" />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <LoadingSkeleton variant="rect" height="180px" className="rounded-[var(--radius-xl)]" />
            <LoadingSkeleton variant="rect" height="180px" className="rounded-[var(--radius-xl)]" />
          </div>
        </div>
      </div>
    );
  }

  const currentMember = couple?.couple_members?.find((m) => m.profile_id === user?.id);
  const userName =
    currentMember?.nickname ||
    currentMember?.profile?.display_name ||
    'bạn';

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 1. Milestone Celebration modal (if today) & Milestone Banner (if <= 7 days) */}
      <MilestoneCelebration />
      <MilestoneBanner />

      {/* 2. Header: Greeting */}
      <header>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text">
          Chào {userName} 💗
        </h1>
        <p className="text-text-muted text-sm sm:text-base mt-1">
          Hôm nay hai bạn đã làm gì cùng nhau chưa?
        </p>
      </header>

      {/* 3. Hero Section: Counter Card + Daily Question */}
      <section aria-label="Đếm ngày yêu & Câu hỏi hằng ngày" className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        <div className="md:col-span-7">
          <CoupleCounter />
        </div>
        <div className="md:col-span-5">
          <DailyQuestionWidget />
        </div>
      </section>

      {/* 4. Calendar + Side widgets: On this day & Upcoming Milestones */}
      <section aria-label="Lịch & Mốc kỷ niệm" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <MonthlyCalendar />
        </div>
        <div className="lg:col-span-5 flex flex-col gap-5">
          <OnThisDayWidget />
          <UpcomingMilestones />
        </div>
      </section>

      {/* 5. Recent Memories (tạm ẩn theo yêu cầu người dùng) */}
      {/*
      <section aria-label="Kỷ niệm gần đây" className="pt-2">
        <RecentDates />
      </section>
      */}

      {/* 6. Wishlist & Spending */}
      <section aria-label="Kế hoạch & Chi tiêu" className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <WishlistWidget />
        <SpendingWidget />
      </section>
    </div>
  );
}
