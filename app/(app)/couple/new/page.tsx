'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Heart, ArrowLeft, AlertCircle } from 'lucide-react';
import { todayVN } from '@/lib/time';

const RELATIONSHIP_OPTIONS = [
  { value: 'talking', label: '💬 Đang tìm hiểu' },
  { value: 'dating', label: '💕 Đang hẹn hò' },
  { value: 'official', label: '❤️ Chính thức' },
  { value: 'engaged', label: '💍 Đã đính hôn' },
  { value: 'married', label: '👑 Đã kết hôn' },
];

export default function NewCouplePage() {
  const router = useRouter();
  const maxDate = todayVN();

  const [anniversaryDate, setAnniversaryDate] = useState(maxDate);
  const [relationshipStatus, setRelationshipStatus] = useState('official');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anniversaryDate) {
      setError('Vui lòng chọn ngày bắt đầu yêu');
      return;
    }
    if (anniversaryDate > maxDate) {
      setError('Ngày bắt đầu yêu không thể ở tương lai');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/couples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anniversary_date: anniversaryDate,
          relationship_status: relationshipStatus,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error || 'Không thể tạo couple. Vui lòng thử lại.');
        setIsLoading(false);
        return;
      }

      // Tạo thành công → chuyển sang trang tạo & chia sẻ lời mời
      router.push('/couple/invite');
      router.refresh();
    } catch {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-6rem)] py-6 sm:py-10">
      <div className="w-full max-w-lg rounded-[28px] border border-border bg-surface p-8 sm:p-10 shadow-[var(--shadow-elevated)]">
        <Link
          href="/couple/setup"
          className="inline-flex items-center gap-2 text-xs font-medium text-text-muted hover:text-text mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại lựa chọn
        </Link>

        <div className="mb-6">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text mb-1.5">
            Tạo couple mới 💕
          </h1>
          <p className="text-sm text-text-muted">
            Thiết lập cột mốc ngày yêu cho không gian của hai bạn.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="c-status">
              Tình trạng mối quan hệ
            </label>
            <select
              id="c-status"
              value={relationshipStatus}
              onChange={(e) => setRelationshipStatus(e.target.value)}
              disabled={isLoading}
              className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            >
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="c-date">
              Ngày bắt đầu yêu ❤️
            </label>
            <input
              id="c-date"
              type="date"
              required
              max={maxDate}
              value={anniversaryDate}
              onChange={(e) => setAnniversaryDate(e.target.value)}
              disabled={isLoading}
              className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            />
            <p className="mt-1 text-[11px] text-text-muted">
              Ngày bắt đầu tính chuỗi ngày yêu của hai bạn.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-fg font-semibold text-sm hover:bg-primary-hover shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tạo couple...</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" />
                <span>Tạo và lấy link mời</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
