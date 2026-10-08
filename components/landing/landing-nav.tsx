import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';

interface LandingNavProps {
  isAuthed?: boolean;
}

export function LandingNav({ isAuthed = false }: LandingNavProps) {
  return (
    <header className="w-full border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-heading font-bold text-xl text-text hover:opacity-90 transition-opacity"
        >
          <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Heart className="w-5 h-5 fill-primary text-primary" />
          </span>
          <span>Dating Journal</span>
        </Link>

        <nav className="flex items-center gap-3">
          {isAuthed ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-[var(--radius-md)] bg-primary text-primary-fg hover:bg-primary-hover shadow-sm transition-colors"
            >
              Mở app
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-9 px-3.5 text-sm font-medium rounded-[var(--radius-md)] text-text hover:bg-surface-hover transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/login?signup=1"
                className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-[var(--radius-md)] bg-primary text-primary-fg hover:bg-primary-hover shadow-sm transition-colors"
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
