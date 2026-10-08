import React from 'react';
import Link from 'next/link';
import { Heart, Sparkles } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-bg flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 font-body">
      <div className="w-full max-w-5xl rounded-[28px] border border-border bg-surface shadow-[var(--shadow-elevated)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left Side: Illustration & Quote */}
        <div className="lg:col-span-5 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/20 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border relative overflow-hidden">
          <div aria-hidden="true" className="absolute -top-12 -left-12 w-48 h-48 bg-primary/20 blur-2xl rounded-full pointer-events-none" />

          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-heading font-bold text-xl text-text hover:opacity-90 transition-opacity"
            >
              <span className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <Heart className="w-5 h-5 fill-primary text-primary" />
              </span>
              <span>Dating Journal</span>
            </Link>
          </div>

          <div className="my-8 lg:my-auto text-left">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-center mb-6 text-primary">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <blockquote className="font-heading italic text-2xl sm:text-3xl font-semibold text-text leading-snug">
              “Mỗi ngày bên nhau là một kỷ niệm đáng nhớ.”
            </blockquote>
            <p className="mt-3 text-sm text-text-muted">
              Không gian riêng tư chỉ hai người — lưu giữ từng bước đường yêu.
            </p>
          </div>

          <div className="text-xs text-text-muted">
            © {new Date().getFullYear()} Dating Journal
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
