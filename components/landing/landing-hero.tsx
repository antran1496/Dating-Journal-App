import React from 'react';
import Link from 'next/link';
import { Lock, Sparkles, BookHeart, ShieldCheck } from 'lucide-react';

interface LandingHeroProps {
  isAuthed?: boolean;
}

export function LandingHero({ isAuthed = false }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
      {/* Decorative gradient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/15 blur-3xl rounded-full"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Cho cặp đôi 16–25 tuổi
              </span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text leading-[1.15]">
              Không gian riêng của <em className="not-italic text-primary font-black">hai đứa</em>, đáng để mở mỗi ngày.
            </h1>

            <p className="text-lg sm:text-xl text-text-muted max-w-xl leading-relaxed">
              Ghi lại buổi hẹn trong 10 giây. Riêng tư tuyệt đối, đủ đáng yêu để muốn khoe.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              {isAuthed ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center h-12 px-7 text-base font-semibold rounded-[var(--radius-lg)] bg-primary text-primary-fg hover:bg-primary-hover shadow-[var(--shadow-glow)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Mở app
                </Link>
              ) : (
                <Link
                  href="/login?signup=1"
                  className="inline-flex items-center justify-center h-12 px-7 text-base font-semibold rounded-[var(--radius-lg)] bg-primary text-primary-fg hover:bg-primary-hover shadow-[var(--shadow-glow)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Tạo không gian của hai bạn
                </Link>
              )}

              <a
                href="#features"
                className="inline-flex items-center justify-center h-12 px-6 text-base font-medium rounded-[var(--radius-lg)] bg-surface text-text border border-border hover:bg-surface-hover shadow-sm transition-all"
              >
                Khám phá tính năng
              </a>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-text-muted pt-2">
              <Lock className="w-4 h-4 text-primary shrink-0" />
              <span>Ảnh chỉ hai bạn thấy. Xuất hoặc xóa dữ liệu bất cứ lúc nào.</span>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[380px] aspect-square rounded-[36px] bg-gradient-to-tr from-primary/20 via-primary/5 to-accent/20 p-6 flex flex-col items-center justify-center border border-border shadow-[var(--shadow-elevated)]">
              {/* Decorative floating badges */}
              <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-border shadow-sm flex items-center gap-2 text-xs font-semibold text-text">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                414 ngày yêu
              </div>

              <div className="absolute bottom-5 right-5 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border shadow-sm flex items-center gap-1.5 text-xs font-medium text-text">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Chỉ 2 thành viên
              </div>

              {/* Center art icon illustration */}
              <div className="w-32 h-32 rounded-3xl bg-surface shadow-[var(--shadow-card)] border border-border/80 flex items-center justify-center text-primary transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <BookHeart className="w-16 h-16 text-primary stroke-[1.5]" />
              </div>

              <p className="mt-6 text-sm font-medium text-text-muted text-center max-w-[240px]">
                Nhật ký riêng tư khóa bằng mã PIN &amp; sinh trắc học
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
