'use client';

import React from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp, Home } from 'lucide-react';
import Link from 'next/link';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetail, setShowDetail] = React.useState(false);

  const errorMessage = error?.message || 'Lỗi không xác định';

  // Classify error
  const isDbError =
    errorMessage.includes('relation') ||
    errorMessage.includes('connect') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('PostgrestError') ||
    errorMessage.includes('supabase') ||
    errorMessage.includes('Không thể tải');
  const isAuthError =
    errorMessage.includes('đăng nhập') ||
    errorMessage.includes('Chưa đăng nhập') ||
    errorMessage.includes('auth') ||
    errorMessage.includes('JWT');
  const isRlsError =
    errorMessage.includes('row-level security') ||
    errorMessage.includes('policy') ||
    errorMessage.includes('permission');

  let friendlyTitle = 'Đã xảy ra lỗi';
  let friendlyDesc = 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
  let emoji = '😔';

  if (isDbError) {
    friendlyTitle = 'Lỗi kết nối cơ sở dữ liệu';
    friendlyDesc = 'Không thể kết nối đến server. Kiểm tra kết nối mạng hoặc thử lại sau.';
    emoji = '🔌';
  } else if (isAuthError) {
    friendlyTitle = 'Lỗi xác thực';
    friendlyDesc = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    emoji = '🔐';
  } else if (isRlsError) {
    friendlyTitle = 'Không có quyền truy cập';
    friendlyDesc = 'Bạn không có quyền truy cập dữ liệu này.';
    emoji = '🚫';
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-5">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-[var(--color-error,#ef4444)]/10 flex items-center justify-center text-4xl">
            {emoji}
          </div>
        </div>

        {/* Title & Description */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-heading font-bold text-text">{friendlyTitle}</h2>
          <p className="text-text-muted text-sm">{friendlyDesc}</p>
        </div>

        {/* Error Detail (toggle) */}
        <div className="bg-surface border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <button
            onClick={() => setShowDetail((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-text-muted hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <span className="font-medium">🔍 Chi tiết lỗi (dành cho developer)</span>
            {showDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showDetail && (
            <div className="px-4 pb-4 space-y-2">
              <pre className="text-xs text-[var(--color-error,#ef4444)] bg-[var(--color-error,#ef4444)]/5 p-3 rounded-[var(--radius-md)] whitespace-pre-wrap break-words font-mono max-h-48 overflow-auto">
                {errorMessage}
              </pre>
              {error?.digest && (
                <p className="text-xs text-text-muted">
                  Digest: <code className="font-mono text-text-muted/70">{error.digest}</code>
                </p>
              )}
              <p className="text-xs text-text-muted">
                Thời gian: <code className="font-mono">{new Date().toLocaleString('vi-VN')}</code>
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary text-primary-fg font-medium rounded-[var(--radius-md)] hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            <RefreshCw size={16} />
            Thử lại
          </button>
          {isAuthError ? (
            <a
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-surface border border-border text-text font-medium rounded-[var(--radius-md)] hover:bg-surface-hover transition-colors"
            >
              Đăng nhập lại
            </a>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-surface border border-border text-text font-medium rounded-[var(--radius-md)] hover:bg-surface-hover transition-colors"
            >
              <Home size={16} />
              Về trang chủ
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
