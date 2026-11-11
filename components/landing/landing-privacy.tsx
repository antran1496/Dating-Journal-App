import React from 'react';
import { Lock, KeyRound, EyeOff, ShieldCheck } from 'lucide-react';

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
                Không gian kỷ niệm chỉ giới hạn tối đa hai thành viên.
                Bảo vệ ứng dụng bằng mã PIN 4 số cá nhân và kiểm soát rõ ràng quyền xem dữ liệu.
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
                  Khóa app PIN
                </span>
                <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-sm font-semibold text-emerald-700 dark:text-emerald-300 shadow-sm">
                  <ShieldCheck className="w-4 h-4" />
                  An toàn &amp; bảo mật
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
