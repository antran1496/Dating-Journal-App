'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useInfiniteDates } from '@/hooks/use-dates';
import { DatesEmptyState } from '@/components/features/dates-empty-state';
import type { DateEntry } from '@/types';

interface DatesInfiniteListProps {
  initialDates: DateEntry[];
  coupleId: string;
}

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

export function DatesInfiniteList({ initialDates, coupleId }: DatesInfiniteListProps) {
  const observerRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
  } = useInfiniteDates(coupleId, {
    pages: [initialDates],
    pageParams: [0],
  });

  // Tự động load more khi scroll tới cuối trang
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      {
        rootMargin: '250px', // Bắt đầu load trước khi user cuộn chạm đáy
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

  const allDates = data?.pages ? data.pages.flat() : initialDates;
  const displayDates = allDates.length > 0 ? allDates : initialDates;

  if (displayDates.length === 0) {
    return <DatesEmptyState />;
  }

  return (
    <div className="flex flex-col gap-4">
      {displayDates.map((date) => {
        const thumbnail = date.checkin_image_urls?.[0] ?? date.checkin_image_url;
        return (
          <Link
            key={date.id}
            href={`/dates/${date.id}`}
            className="group flex rounded-[var(--radius-lg)] bg-surface border border-border hover:border-primary/30 hover:shadow-[var(--shadow-card)] transition-all overflow-hidden p-3 gap-4"
          >
            <div className="shrink-0 w-24 h-20 rounded-[var(--radius-md)] overflow-hidden">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={date.location_name ?? ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-2xl">
                  📍
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center min-w-0 flex-1">
              <h3 className="font-semibold text-text truncate mb-0.5">
                {formatDate(date.date_time ?? date.created_at, date.end_date)}
              </h3>
              <p className="text-text-muted text-xs mb-1.5">
                📍 {date.location_name ?? 'Không có địa điểm'}
              </p>

              <div className="flex items-center gap-2 mt-auto">
                {date.rating && (
                  <div className="flex gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-[10px] ${
                          i < date.rating! ? 'text-primary' : 'text-text-muted opacity-30'
                        }`}
                      >
                        ♥
                      </span>
                    ))}
                  </div>
                )}
                {date.pros && (
                  <p className="text-xs text-text-muted truncate">• {date.pros}</p>
                )}
              </div>
            </div>
          </Link>
        );
      })}

      {/* Sentinel element nhận diện cuộn chuột để tự động kích hoạt load more */}
      <div ref={observerRef} className="h-4" />

      {/* Loading indicator khi đang fetch trang tiếp theo */}
      {isFetchingNextPage && (
        <div className="py-4 flex items-center justify-center gap-2 text-text-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Đang tải thêm kỷ niệm...</span>
        </div>
      )}

      {/* Báo lỗi nếu tải thất bại và có nút thử lại */}
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

      {/* Đã tải hết danh sách */}
      {!hasNextPage && displayDates.length > 0 && (
        <div className="py-6 text-center text-xs text-text-muted opacity-70">
          ✨ Đã hiển thị tất cả {displayDates.length} kỷ niệm
        </div>
      )}
    </div>
  );
}
