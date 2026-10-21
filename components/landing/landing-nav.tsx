import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';

interface LandingNavProps {
  isAuthed?: boolean;
}

export function LandingNav({ isAuthed = false }: LandingNavProps) {
  return (
    <header className="w-full border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading font-bold text-base sm:text-xl text-text hover:opacity-90 transition-opacity shrink-0"
        >
          <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-primary text-primary" />
          </span>
          <span className="whitespace-nowrap">Dating Journal</span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {isAuthed ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] bg-primary text-primary-fg hover:bg-primary-hover shadow-sm transition-colors whitespace-nowrap"
            >
              Mở app
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-8 sm:h-9 px-2.5 sm:px-3.5 text-xs sm:text-sm font-medium rounded-[var(--radius-md)] text-text hover:bg-surface-hover transition-colors whitespace-nowrap"
              >
                Đăng nhập
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] bg-primary text-primary-fg hover:bg-primary-hover shadow-sm transition-colors whitespace-nowrap"
              >
                Bắt đầu
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
