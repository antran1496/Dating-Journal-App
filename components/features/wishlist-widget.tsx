'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Circle } from 'lucide-react';
import { useCouple } from '@/hooks/use-couple';
import { useWishlist, useToggleWishlistItem } from '@/hooks/use-wishlist';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export function WishlistWidget() {
  const { couple, isLoading: isLoadingCouple } = useCouple();
  const { data: items = [], isLoading: isLoadingWishlist } = useWishlist(couple?.id);
  const toggleMutation = useToggleWishlistItem(couple?.id);

  if (isLoadingCouple || isLoadingWishlist) {
    return (
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 space-y-3">
        <div className="flex justify-between items-center">
          <LoadingSkeleton variant="text" width="160px" height="20px" />
          <LoadingSkeleton variant="text" width="80px" height="18px" />
        </div>
        <LoadingSkeleton variant="rect" height="48px" className="rounded-[var(--radius-lg)]" />
        <LoadingSkeleton variant="rect" height="48px" className="rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  const pendingItems = items.filter((i) => !i.done_at).slice(0, 3);

  return (
    <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs flex flex-col justify-between gap-3.5 h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base sm:text-lg font-bold text-text flex items-center gap-2">
          <span>🎯</span> Muốn thử cùng nhau
        </h3>
        <Link
          href="/together"
          className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5"
        >
          <span>Mở wishlist</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {pendingItems.length === 0 ? (
        <div className="py-6 px-3 rounded-[var(--radius-lg)] bg-surface-hover/30 border border-dashed border-border text-center">
          <p className="text-xs text-text-muted">
            Chưa có dự định nào đang chờ.
          </p>
          <Link
            href="/together"
            className="text-xs text-primary font-medium hover:underline inline-block mt-1"
          >
            + Thêm điều muốn làm cùng nhau
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pendingItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-[var(--radius-lg)] bg-surface-hover/60 border border-border/80 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <button
                  type="button"
                  onClick={() => toggleMutation.mutate({ id: item.id, done: true })}
                  className="text-text-muted hover:text-emerald-500 transition-colors shrink-0 cursor-pointer"
                  title="Đánh dấu hoàn thành"
                >
                  <Circle size={17} />
                </button>
                <span className="text-sm font-medium text-text truncate">
                  {item.title}
                </span>
              </div>

              {item.budget_vnd && (
                <span className="text-[11px] font-mono text-text-muted bg-surface px-2 py-0.5 rounded-full border border-border shrink-0">
                  {item.budget_vnd.toLocaleString('vi-VN')}đ
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
