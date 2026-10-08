import React from 'react';
import Link from 'next/link';
import { Heart, Link2, ChevronRight } from 'lucide-react';

export default function CoupleSetupPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-6rem)] py-6 sm:py-10">
      <div className="w-full max-w-lg rounded-[28px] border border-border bg-surface p-8 sm:p-10 shadow-[var(--shadow-elevated)]">
        {/* Step indicator: Step 2 of 2 */}
        <div className="flex items-center gap-2 mb-6" aria-label="Bước 2 trên 2">
          <div className="h-1.5 w-10 rounded-full bg-primary" />
          <div className="h-1.5 w-10 rounded-full bg-primary" />
        </div>

        <div className="mb-6">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text mb-1.5">
            Bạn muốn làm gì?
          </h1>
          <p className="text-sm text-text-muted">
            Bắt đầu câu chuyện tình yêu của hai bạn.
          </p>
        </div>

        <div className="space-y-3.5">
          <Link
            href="/couple/new"
            className="w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl border border-border bg-surface hover:bg-surface-hover hover:border-primary/40 transition-all text-left group shadow-sm active:scale-[0.99]"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Heart className="w-6 h-6 fill-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading font-semibold text-text text-base sm:text-lg">
                Tạo couple mới
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                Bắt đầu và mời người yêu tham gia
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors shrink-0 ml-1" />
          </Link>

          <Link
            href="/couple/join"
            className="w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl border border-border bg-surface hover:bg-surface-hover hover:border-accent/40 transition-all text-left group shadow-sm active:scale-[0.99]"
          >
            <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Link2 className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading font-semibold text-text text-base sm:text-lg">
                Tham gia bằng mã mời
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                Đã có mã từ người yêu? Nhập vào đây
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors shrink-0 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
