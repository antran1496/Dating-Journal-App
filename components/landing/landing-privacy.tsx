import React from 'react';
import { Lock, KeyRound, DownloadCloud, EyeOff } from 'lucide-react';

export function LandingPrivacy() {
  return (
    <section className="py-16 md:py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-[var(--radius-xl)] border border-border bg-gradient-to-br from-surface to-surface-hover p-8 sm:p-12 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Bảo mật &amp; Minh bạch
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text tracking-tight">
                Riêng tư nhìn thấy được
              </h2>
              <p className="text-base sm:text-lg text-text-muted leading-relaxed">
                Ảnh buổi hẹn dùng đường dẫn có hạn, người ngoài không mở được dù có link.
                Khóa app bằng PIN hoặc sinh trắc học. Rời couple bằng hai bước xác nhận và được giữ bản sao.
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border text-sm font-semibold text-text shadow-sm">
                  <Lock className="w-4 h-4 text-primary" />
                  Chỉ hai bạn thấy
                </span>
                <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900 text-sm font-semibold text-violet-700 dark:text-violet-300 shadow-sm">
                  <KeyRound className="w-4 h-4" />
                  Khóa app
                </span>
                <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-sm font-semibold text-amber-700 dark:text-amber-300 shadow-sm">
                  <DownloadCloud className="w-4 h-4" />
                  Xuất ZIP
                </span>
              </div>

              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-text-muted bg-surface/60 rounded-xl p-3.5 border border-border/80">
                <EyeOff className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                <span>Thẻ chia sẻ ra ngoài ẩn địa điểm chính xác và ghi chú riêng theo mặc định.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
