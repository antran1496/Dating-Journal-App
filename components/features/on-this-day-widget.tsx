'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { useCouple } from '@/hooks/use-couple';
import { useOnThisDay } from '@/hooks/use-dates';
import { SecureImage } from '@/components/features/secure-image';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export function OnThisDayWidget() {
  const router = useRouter();
  const { couple, isLoading: isLoadingCouple } = useCouple();
  const { data: otdDates = [], isLoading: isLoadingOtd } = useOnThisDay(couple?.id);

  if (isLoadingCouple || isLoadingOtd) {
    return (
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 space-y-3">
        <LoadingSkeleton variant="text" width="40%" height="20px" />
        <LoadingSkeleton variant="rect" height="80px" className="rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  const memory = otdDates.length > 0 ? otdDates[0] : null;
  const memoryDate = memory?.date_time ? new Date(memory.date_time) : null;
  const yearsAgo = memoryDate ? differenceInYears(new Date(), memoryDate) : 1;

  return (
    <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base sm:text-lg font-bold text-text flex items-center gap-2">
          <span>✨</span> Ngày này năm ngoái
        </h3>
        <Link
          href="/dates/on-this-day"
          className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5"
        >
          <span>Xem tất cả</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {memory ? (
        <div
          onClick={() => router.push(`/dates/${memory.id}`)}
          className="group flex items-center gap-3.5 p-3 rounded-[var(--radius-lg)] bg-surface-hover/60 border border-border/80 hover:border-primary/40 hover:bg-surface-hover transition-all cursor-pointer"
        >
          <div className="w-16 h-16 rounded-[var(--radius-md)] overflow-hidden shrink-0 bg-surface border border-border">
            <SecureImage
              src={memory.checkin_image_url}
              alt={memory.title || 'Kỷ niệm'}
              size="thumb"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10 inline-block mb-1">
              {yearsAgo > 0 ? `${yearsAgo} năm trước` : 'Năm ngoái'}
            </span>
            <h4 className="font-semibold text-sm text-text truncate group-hover:text-primary transition-colors">
              {memory.title || 'Buổi hẹn đặc biệt'}
            </h4>
            {memoryDate && (
              <p className="text-xs text-text-muted mt-0.5">
                {format(memoryDate, 'dd/MM/yyyy')}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="py-4 px-3 rounded-[var(--radius-lg)] bg-surface-hover/30 border border-dashed border-border text-center">
          <p className="text-xs text-text-muted">
            Hôm nay chưa có kỷ niệm nào từ những năm trước.
          </p>
          <Link
            href="/dates/new"
            className="text-xs text-primary font-medium hover:underline inline-block mt-1.5"
          >
            + Ghi lại kỷ niệm cho ngày hôm nay
          </Link>
        </div>
      )}
    </div>
  );
}
