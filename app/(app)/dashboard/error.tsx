'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <p className="text-5xl">😢</p>
      <h2 className="font-heading text-xl font-bold text-text">Không thể tải trang</h2>
      <p className="text-text-muted text-sm max-w-sm">
        Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-primary text-primary-fg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <RefreshCw size={16} />
        Thử lại
      </button>
    </div>
  );
}
