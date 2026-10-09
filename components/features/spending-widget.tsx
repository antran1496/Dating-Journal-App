'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, Wallet } from 'lucide-react';
import { useSpending } from '@/hooks/use-spending';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export function SpendingWidget() {
  const { data, isLoading } = useSpending();

  if (isLoading) {
    return (
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 space-y-3">
        <div className="flex justify-between items-center">
          <LoadingSkeleton variant="text" width="160px" height="20px" />
          <LoadingSkeleton variant="text" width="80px" height="18px" />
        </div>
        <LoadingSkeleton variant="rect" height="40px" className="rounded-[var(--radius-lg)]" />
        <LoadingSkeleton variant="text" width="100%" height="12px" />
      </div>
    );
  }

  const stats = data?.data;
  const total = stats?.total || 0;
  const budget = stats?.budgetVnd || null;
  const progress = stats?.budgetProgress || 0;
  const isOver = stats?.isOverBudget || false;

  const formattedTotal = new Intl.NumberFormat('vi-VN').format(total) + 'đ';
  const formattedBudget = budget ? new Intl.NumberFormat('vi-VN').format(budget) + 'đ' : null;

  return (
    <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs flex flex-col justify-between gap-3.5 h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base sm:text-lg font-bold text-text flex items-center gap-2">
          <span>💸</span> Chi tiêu tháng này
        </h3>
        <Link
          href="/spending"
          className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5"
        >
          <span>Xem chi tiết</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            {formattedTotal}
          </span>
          {formattedBudget ? (
            <span className="text-xs text-text-muted">
              Mục tiêu: <strong className="text-text">{formattedBudget}</strong>
            </span>
          ) : (
            <Link
              href="/spending"
              className="text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-1"
            >
              <Wallet size={12} />
              <span>Chưa đặt ngân sách</span>
            </Link>
          )}
        </div>

        {budget ? (
          <div className="space-y-1.5">
            <div className="w-full h-2.5 bg-surface-hover rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isOver
                    ? 'bg-amber-500'
                    : progress > 80
                    ? 'bg-amber-400'
                    : 'bg-primary'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              {isOver ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <AlertTriangle size={13} />
                  <span>Vượt ngân sách {progress}%</span>
                </span>
              ) : (
                <span className="text-text-muted">Đã chi {progress}%</span>
              )}
              <span className="text-text-muted">
                {isOver
                  ? `Vượt ${new Intl.NumberFormat('vi-VN').format(total - budget)}đ`
                  : `Còn lại ${new Intl.NumberFormat('vi-VN').format(budget - total)}đ`}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-muted">
            Theo dõi chi tiêu chung cho các buổi hẹn để cùng nhau quản lý tài chính vui vẻ.
          </p>
        )}
      </div>
    </div>
  );
}
