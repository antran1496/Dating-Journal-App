import React from 'react';
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface py-8 text-sm text-text-muted transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span>© {new Date().getFullYear()} Dating Journal</span>
        </div>

        <nav aria-label="Liên kết pháp lý và hỗ trợ" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
          <Link
            href="/privacy"
            className="hover:text-text transition-colors"
          >
            Chính sách quyền riêng tư
          </Link>
          <span className="text-border" aria-hidden="true">·</span>
          <Link
            href="/terms"
            className="hover:text-text transition-colors"
          >
            Điều khoản
          </Link>
          <span className="text-border" aria-hidden="true">·</span>
          <Link
            href="/contact"
            className="hover:text-text transition-colors"
          >
            Liên hệ
          </Link>
        </nav>
      </div>
    </footer>
  );
}
