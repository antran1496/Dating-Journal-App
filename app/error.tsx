'use client';

import React from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetail, setShowDetail] = React.useState(false);

  // Extract meaningful message
  const errorMessage = error?.message || 'Lỗi không xác định';
  const isDbError =
    errorMessage.includes('relation') ||
    errorMessage.includes('connect') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('PostgrestError') ||
    errorMessage.includes('supabase');
  const isAuthError =
    errorMessage.includes('đăng nhập') ||
    errorMessage.includes('auth') ||
    errorMessage.includes('JWT');

  let friendlyTitle = 'Đã xảy ra lỗi';
  let friendlyDesc = 'Không thể xử lý yêu cầu. Vui lòng thử lại.';

  if (isDbError) {
    friendlyTitle = 'Lỗi kết nối cơ sở dữ liệu';
    friendlyDesc = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.';
  } else if (isAuthError) {
    friendlyTitle = 'Lỗi xác thực';
    friendlyDesc = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-error,#ef4444)]/10 flex items-center justify-center">
            <AlertCircle size={32} className="text-[var(--color-error,#ef4444)]" />
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
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-text-muted hover:bg-surface-hover transition-colors"
          >
            <span className="font-medium">Chi tiết lỗi</span>
            {showDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showDetail && (
            <div className="px-4 pb-4 space-y-2">
              <pre className="text-xs text-[var(--color-error,#ef4444)] bg-[var(--color-error,#ef4444)]/5 p-3 rounded-[var(--radius-md)] whitespace-pre-wrap break-words font-mono max-h-40 overflow-auto">
                {errorMessage}
              </pre>
              {error?.digest && (
                <p className="text-xs text-text-muted">
                  Digest: <code className="font-mono text-text-muted/70">{error.digest}</code>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary text-primary-fg font-medium rounded-[var(--radius-md)] hover:opacity-90 transition-opacity shadow-sm"
          >
            <RefreshCw size={16} />
            Thử lại
          </button>
          {isAuthError && (
            <a
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-surface border border-border text-text font-medium rounded-[var(--radius-md)] hover:bg-surface-hover transition-colors"
            >
              Đăng nhập lại
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
