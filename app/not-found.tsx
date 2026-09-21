import React from 'react';
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <EmptyState
        icon={<FileQuestion size={40} />}
        title="Trang không tồn tại"
        description="Có vẻ như trang bạn đang tìm kiếm không tồn tại hoặc đã bị di dời."
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-[var(--radius-md)] bg-primary text-primary-fg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Quay lại trang chủ
        </Link>
      </EmptyState>
    </div>
  );
}
