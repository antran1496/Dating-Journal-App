'use client';

import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { useCouple, calculateMilestoneProgress } from '@/hooks/use-couple';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

const RELATIONSHIP_STATUS_LABELS: Record<string, string> = {
  talking: '💬 Đang tìm hiểu',
  dating: '💕 Đang hẹn hò',
  official: '❤️ Chính thức',
  engaged: '💍 Đã đính hôn',
  married: '👰🤵 Đã kết hôn',
};

export function CoupleCounter() {
  const { couple, daysCount, nextMilestones, isLoading } = useCouple();

  if (isLoading) {
    return (
      <LoadingSkeleton
        variant="rect"
        height="260px"
        className="rounded-[var(--radius-xl)]"
      />
    );
  }

  if (!couple) return null;

  const members = couple.couple_members ?? [];
  const status = couple.relationship_status ?? 'official';
  const statusLabel = RELATIONSHIP_STATUS_LABELS[status] ?? '❤️ Chính thức';

  const nextM = nextMilestones.length > 0 ? nextMilestones[0] : null;
  const progress = nextM ? calculateMilestoneProgress(nextM, daysCount) : 0;

  return (
    <div className="relative rounded-[var(--radius-xl)] overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-accent p-4 sm:p-6 md:p-8 text-white shadow-[var(--shadow-elevated)] flex flex-col gap-3.5 sm:gap-5">
      {/* Background ambient blobs */}
      <div className="pointer-events-none absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 -bottom-12 w-32 h-32 rounded-full bg-white/10 blur-2xl" />

      {/* Floating emoji decorations */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[22%] top-[16%] text-2xl select-none animate-pulse opacity-85"
      >
        💗
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[8%] top-[50%] text-xl select-none opacity-75"
      >
        ✨
      </span>

      {/* Top bar: Story title + Relationship status badge */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-xs sm:text-sm font-medium text-white/90 tracking-wide">
          Câu chuyện tình yêu của chúng ta
        </span>
        <span className="px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white border border-white/25 shadow-sm">
          {statusLabel}
        </span>
      </div>

      {/* Center: Avatars (left) + Big day count (right) */}
      <div className="relative z-10 flex items-end justify-between gap-3 sm:gap-6">
        {/* Avatars */}
        <div className="flex items-center -space-x-3 sm:-space-x-4 shrink-0 mb-1">
          {members.map((m, idx) => (
            <Avatar
              key={m.profile_id}
              src={m.profile?.avatar_url ?? undefined}
              name={m.profile?.display_name ?? `U${idx + 1}`}
              className="ring-2 sm:ring-3 ring-white shadow-md w-12 h-12 sm:w-14 sm:h-14 shrink-0"
            />
          ))}
        </div>

        {/* Day count aligned to right */}
        <div className="min-w-0 flex-1 text-right">
          <div className="text-4xl sm:text-6xl md:text-7xl font-heading font-extrabold tracking-tight leading-none text-white drop-shadow-sm">
            {daysCount !== null ? daysCount.toLocaleString('vi-VN') : '—'}
          </div>
          <div className="text-xs sm:text-base font-semibold text-white/90 mt-1 sm:mt-1.5">
            {daysCount === 0 ? 'Hôm nay là ngày đầu tiên 🎉' : 'ngày bên nhau'}
          </div>
        </div>
      </div>

      {/* Names & Nicknames */}
      {members.length > 0 && (
        <div className="relative z-10 text-xs sm:text-base text-white/95 font-medium leading-relaxed">
          {members.map((m, i) => {
            const name = m.profile?.display_name || 'Người ấy';
            const nickname = m.nickname?.trim();
            return (
              <React.Fragment key={m.profile_id}>
                <span>{name}</span>
                {nickname && (
                  <span className="ml-1 opacity-90 font-serif italic text-base sm:text-lg">
                    ({nickname})
                  </span>
                )}
                {i < members.length - 1 && <span className="mx-1.5 text-white/80">&</span>}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Next milestone block with progress bar */}
      {nextM && (
        <div className="relative z-10 bg-white/15 backdrop-blur-md rounded-[var(--radius-lg)] p-3.5 sm:p-4 border border-white/25 shadow-inner flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="flex items-center gap-1.5 text-white/95">
              <span>{nextM.type === 'birthday' ? '🎂' : '🎁'}</span>
              <span>
                Mốc tiếp theo: <strong className="font-bold text-white">{nextM.label}</strong>
              </span>
            </span>
            <span className="font-bold text-white">
              {nextM.daysUntil === 0 ? 'Hôm nay! 🎉' : `còn ${nextM.daysUntil} ngày`}
            </span>
          </div>

          <div
            className="h-2 w-full rounded-full bg-white/25 overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Tiến độ tới mốc ${nextM.label}`}
          >
            <div
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
