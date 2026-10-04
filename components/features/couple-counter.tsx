'use client';

import React, { useEffect, useState } from 'react';
import { Heart, Calendar, Gift } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useCouple } from '@/hooks/use-couple';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

const RELATIONSHIP_STATUS_LABELS: Record<string, string> = {
  talking: 'Đang tìm hiểu',
  dating: 'Đang hẹn hò',
  official: 'Chính thức',
  engaged: 'Đã đính hôn 💍',
  married: 'Đã kết hôn 👑',
};



export function CoupleCounter() {
  const { couple, daysCount, nextMilestones, isLoading } = useCouple();

  if (isLoading) {
    return <LoadingSkeleton variant="rect" height="200px" className="rounded-2xl" />;
  }

  if (!couple) return null;

  const members = couple.couple_members ?? [];
  const status = couple.relationship_status ?? 'dating';

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-accent p-6 md:p-8 text-white shadow-[var(--shadow-elevated)]">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 left-8 w-24 h-24 rounded-full bg-white blur-2xl" />
      </div>

      <div className="relative z-10">
        {/* Status badge */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-white/80">Câu chuyện tình yêu của chúng ta</span>
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm">
            {RELATIONSHIP_STATUS_LABELS[status] ?? status}
          </span>
        </div>

        {/* Avatars + Day count */}
        <div className="flex items-center gap-4 mb-6">
          {/* Partner avatars */}
          <div className="flex items-center -space-x-3">
            {members.map((m) => (
              <Avatar
                key={m.profile_id}
                src={m.profile?.avatar_url ?? undefined}
                name={m.profile?.display_name ?? '?'}
                size="lg"
                className="ring-2 ring-white/70 shadow-sm"
              />
            ))}
          </div>

          {/* Day count */}
          <div className="flex-1 text-right">
            <div className="text-5xl md:text-7xl font-heading font-bold tracking-tighter leading-none">
              {daysCount !== null ? daysCount.toLocaleString('vi-VN') : '—'}
            </div>
            <div className="text-sm font-medium text-white/80 mt-1">
              {daysCount === 0 ? 'Hôm nay là ngày đầu tiên 🎉' : 'ngày bên nhau'}
            </div>
          </div>
        </div>

        {/* Partner names */}
        {members.length > 0 && (
          <div className="text-sm text-white/70 mb-4">
            {members.map((m, i) => (
              <span key={m.profile_id}>
                {m.nickname ?? m.profile?.display_name ?? 'Người ơi'}
                {i < members.length - 1 && ' & '}
              </span>
            ))}
          </div>
        )}

        {/* Next milestone */}
        {nextMilestones.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-white/70 bg-white/10 rounded-[var(--radius-md)] px-3 py-2 backdrop-blur-sm">
            <Gift size={14} />
            <span>
              Mốc tiếp theo: <strong className="text-white">{nextMilestones[0].label}</strong> — còn{' '}
              <strong className="text-white">{nextMilestones[0].daysUntil} ngày</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
