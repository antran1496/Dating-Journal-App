'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <EmptyState
        icon={<AlertCircle size={36} />}
        title="Đã xảy ra lỗi"
        description="Đã xảy ra lỗi khi tải dữ liệu hoặc xử lý yêu cầu. Vui lòng thử lại."
        action={reset}
        actionLabel="Thử lại"
      />
    </div>
  );
}
