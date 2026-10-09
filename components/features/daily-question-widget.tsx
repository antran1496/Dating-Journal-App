'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Flame, HelpCircle } from 'lucide-react';
import { useCouple } from '@/hooks/use-couple';
import { useDailyQuestion } from '@/hooks/use-daily';
import { useSessionUser } from '@/components/providers/session-provider';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export function DailyQuestionWidget() {
  const { user } = useSessionUser();
  const { couple, isLoading: isLoadingCouple } = useCouple();
  const { data, isLoading: isLoadingDaily } = useDailyQuestion(couple?.id);

  if (isLoadingCouple || isLoadingDaily) {
    return (
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <LoadingSkeleton variant="text" width="140px" height="22px" />
          <LoadingSkeleton variant="rect" width="80px" height="24px" className="rounded-full" />
        </div>
        <LoadingSkeleton variant="text" width="90%" height="32px" />
        <div className="flex gap-2">
          <LoadingSkeleton variant="rect" width="110px" height="26px" className="rounded-full" />
          <LoadingSkeleton variant="rect" width="110px" height="26px" className="rounded-full" />
        </div>
        <div className="flex justify-between pt-2">
          <LoadingSkeleton variant="rect" width="90px" height="28px" className="rounded-full" />
          <LoadingSkeleton variant="rect" width="100px" height="32px" className="rounded-full" />
        </div>
      </div>
    );
  }

  const today = data?.today;
  const question = today?.question;
  if (!question) return null;

  const partnerMember = couple?.couple_members?.find((m) => m.profile_id !== user?.id);
  const partnerName =
    partnerMember?.nickname || partnerMember?.profile?.display_name || 'Người ấy';

  const myDone = today.myStatus === 'answered';
  const partnerDone = today.partnerStatus === 'answered';
  const bothDone = myDone && partnerDone;

  const statusBadgeText = bothDone
    ? 'Cả hai đã xong'
    : myDone
    ? `Đợi ${partnerName}`
    : partnerDone
    ? 'Đợi bạn'
    : 'Đợi cả hai';

  return (
    <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-6 shadow-xs flex flex-col justify-between gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base sm:text-lg font-bold text-text flex items-center gap-2">
          <span>💌</span> Câu hỏi hôm nay
        </h3>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
            bothDone
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          }`}
        >
          {statusBadgeText}
        </span>
      </div>

      {/* Question Text */}
      <p className="font-heading text-lg sm:text-xl font-bold text-text leading-snug line-clamp-3">
        {question.text_vi}
      </p>

      {/* Status Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
            myDone
              ? 'bg-primary/10 text-primary border border-primary/25 font-semibold'
              : 'bg-surface-hover text-text-muted border border-border'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span>Bạn: {myDone ? 'Đã trả lời' : 'Chưa trả lời'}</span>
        </span>

        <span
          className={`px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
            partnerDone
              ? 'bg-accent/15 text-accent border border-accent/30 font-semibold'
              : 'bg-surface-hover text-text-muted border border-border'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span>
            {partnerName}: {partnerDone ? 'Đã trả lời' : 'Chưa trả lời'}
          </span>
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60 mt-auto">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold text-xs">
          <Flame size={14} className="fill-orange-500 stroke-orange-500" />
          <span>Chuỗi {today.streak} ngày</span>
        </span>

        <Link
          href="/daily"
          className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-primary text-white font-semibold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all shadow-xs"
        >
          <span>{bothDone ? 'Xem kết quả' : 'Trả lời ngay'}</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
