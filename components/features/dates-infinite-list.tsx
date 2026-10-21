'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Loader2, MapPin, Tag } from 'lucide-react';
import { useInfiniteDates, type DateFilters, type DatesPageResult } from '@/hooks/use-dates';
import { DatesEmptyState } from '@/components/features/dates-empty-state';
import { SecureImage } from '@/components/features/secure-image';
import type { DateEntry } from '@/types';

interface DatesInfiniteListProps {
  coupleId: string;
  filters?: DateFilters;
}

const MOOD_EMOJIS: Record<string, string> = {
  love: '❤️',
  happy: '😊',
  calm: '🌿',
  excited: '✨',
  tired: '🥱',
  sad: '🥺',
};

function formatDate(dateStr: string | null, endDateStr: string | null = null): string {
  if (!dateStr) return 'Chưa ghi nhận';
  const start = new Intl.DateTimeFormat('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));

  if (endDateStr) {
    const end = new Intl.DateTimeFormat('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(endDateStr));
    return `${start} - ${end}`;
  }

  return start;
}

export function DatesInfiniteList({ coupleId, filters }: DatesInfiniteListProps) {
  const observerRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    isLoading,
  } = useInfiniteDates(coupleId, filters);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      {
        rootMargin: '250px',
        threshold: 0,
      }
    );

    const target = observerRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted">Đang tải kỷ niệm...</div>;
  }

  const displayDates = data?.pages
    ? data.pages.flatMap((page) => (Array.isArray(page) ? page : page.data || []))
    : [];
  const firstPageWithTotal = data?.pages?.find(
    (p) => typeof (p as DatesPageResult)?.total === 'number'
  ) as DatesPageResult | undefined;
  const totalCount = firstPageWithTotal?.total ?? displayDates.length;

  if (displayDates.length === 0) {
    return <DatesEmptyState />;
  }

  return (
    <div className="flex flex-col gap-3.5">
      {displayDates.map((date) => {
        const rawMedia = (date.media && date.media.length > 0 ? date.media[0] : null)
          ?? (date as unknown as { date_media?: { id: string; path?: string }[] }).date_media?.[0];
        const firstMediaId = rawMedia?.id;
        const thumbnail = rawMedia?.path ?? date.checkin_image_urls?.[0] ?? date.checkin_image_url;
        const moodEmoji = date.mood ? MOOD_EMOJIS[date.mood] : null;

        return (
          <Link
            key={date.id}
            href={`/dates/${date.id}`}
            className="group flex rounded-[var(--radius-lg)] bg-surface border border-border hover:border-primary/40 hover:shadow-[var(--shadow-card)] transition-all overflow-hidden p-3 gap-3.5"
          >
            {/* Thumbnail */}
            <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-24 rounded-[var(--radius-md)] overflow-hidden bg-neutral-100 dark:bg-neutral-900 relative">
              {firstMediaId || thumbnail ? (
                <SecureImage
                  mediaId={firstMediaId}
                  src={thumbnail}
                  size="thumb"
                  alt={date.title || date.location_name || 'Kỷ niệm'}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-2xl">
                  {moodEmoji || '💕'}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs text-text-muted font-medium">
                    {formatDate(date.date_time ?? date.created_at, date.end_date)}
                  </span>
                  {moodEmoji && (
                    <span className="text-sm shrink-0" title={`Cảm xúc: ${date.mood}`}>
                      {moodEmoji}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-text text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                  {date.title || date.location_name || 'Kỷ niệm bên nhau'}
                </h3>

                {date.note && (
                  <p className="text-xs text-text-muted line-clamp-1 mt-0.5">{date.note}</p>
                )}
              </div>

              {/* Bottom line: location, tags, rating */}
              <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-border/40 text-[11px] text-text-muted">
                <div className="flex items-center gap-1.5 truncate">
                  {date.location_name && (
                    <span className="flex items-center gap-0.5 truncate">
                      <MapPin size={11} className="shrink-0 text-primary" />
                      <span className="truncate">{date.location_name}</span>
                    </span>
                  )}
                  {date.tags && date.tags.length > 0 && (
                    <span className="truncate text-primary/80 hidden sm:inline">
                      {date.tags[0]}
                    </span>
                  )}
                </div>

                {date.rating && (
                  <div className="flex gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-[9px] ${
                          i < date.rating! ? 'text-primary' : 'text-text-muted opacity-30'
                        }`}
                      >
                        ♥
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}

      <div ref={observerRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="py-4 flex items-center justify-center gap-2 text-text-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Đang tải thêm kỷ niệm...</span>
        </div>
      )}

      {isError && (
        <div className="py-4 text-center">
          <p className="text-xs text-[var(--color-error)] mb-1.5">
            Không thể tải thêm kỷ niệm, vui lòng thử lại
          </p>
          <button
            type="button"
            onClick={() => fetchNextPage()}
            className="text-xs text-primary font-medium hover:underline cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {!hasNextPage && displayDates.length > 0 && (
        <div className="py-6 text-center text-xs text-text-muted opacity-70">
          ✨ Đã hiển thị tất cả {totalCount} kỷ niệm
        </div>
      )}
    </div>
  );
}
