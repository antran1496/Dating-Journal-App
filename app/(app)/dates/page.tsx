'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { DatesInfiniteList } from '@/components/features/dates-infinite-list';
import { useCouple } from '@/hooks/use-couple';
import { useInfiniteDates } from '@/hooks/use-dates';

export default function DatesPage() {
  const { couple, isLoading: isLoadingCouple } = useCouple();
  
  // Lấy dữ liệu dates trực tiếp từ cache hoặc hook (đã được prefetch bởi CacheWarmup)
  const { data } = useInfiniteDates(couple?.id);
  
  const totalCount = data?.pages ? data.pages.flat().length : 0;
  
  if (isLoadingCouple) {
    return <div className="p-8 text-center text-text-muted">Đang tải dữ liệu...</div>;
  }

  if (!couple) {
    return null; // CoupleGuard sẽ xử lý redirect
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Buổi hẹn hò 📅</h1>
          <p className="text-text-muted text-sm mt-1">{totalCount} kỷ niệm đã hiển thị</p>
        </div>
        <Link
          href="/dates/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] bg-primary text-primary-fg font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus size={18} /> Thêm mới
        </Link>
      </div>

      <DatesInfiniteList coupleId={couple.id} />
    </div>
  );
}

