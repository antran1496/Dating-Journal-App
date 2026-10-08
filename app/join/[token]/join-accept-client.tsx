'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Loader2, AlertCircle } from 'lucide-react';

interface JoinAcceptClientProps {
  token: string;
  inviterName: string;
  inviterAvatar?: string | null;
  message?: string | null;
  hoursLeft: number;
}

export function JoinAcceptClient({
  token,
  inviterName,
  inviterAvatar,
  message,
  hoursLeft,
}: JoinAcceptClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/invites/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.message || 'Không thể tham gia couple. Vui lòng thử lại.');
        setIsLoading(false);
        return;
      }

      // Hard redirect to dashboard
      window.location.href = '/dashboard';
    } catch {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg rounded-[28px] border border-border bg-surface p-8 sm:p-10 shadow-[var(--shadow-elevated)] text-center">
      {/* Avatars */}
      <div className="flex items-center justify-center -space-x-3 mb-6">
        <div className="relative w-16 h-16 rounded-full border-3 border-surface bg-primary/20 flex items-center justify-center overflow-hidden shadow-sm">
          {inviterAvatar ? (
            <Image
              src={inviterAvatar}
              alt={inviterName}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <span className="font-heading font-bold text-xl text-primary">
              {inviterName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="w-16 h-16 rounded-full border-3 border-surface bg-surface-hover border-dashed border-border flex items-center justify-center shadow-sm">
          <Heart className="w-6 h-6 text-primary/50" />
        </div>
      </div>

      <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text mb-2">
        {inviterName} mời bạn cùng ghi lại hành trình
      </h1>
      <p className="text-xs sm:text-sm text-text-muted mb-6 leading-relaxed">
        Sau khi tham gia, hai bạn cùng thấy kỷ niệm, wishlist và câu hỏi hằng ngày.
      </p>

      {/* Message card */}
      <div className="rounded-2xl border border-border bg-surface-hover/60 p-5 mb-5 text-center">
        <blockquote className="font-heading italic text-base sm:text-lg font-medium text-text leading-snug">
          “{message || 'Mình tạo chỗ này cho hai đứa. Vào đi người yêu 💗'}”
        </blockquote>
      </div>

      <p className="text-xs text-text-muted mb-6">
        Lời mời hết hạn sau {hoursLeft} giờ. Chỉ hai bạn xem được nội dung chung.
      </p>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-start gap-2.5 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleAccept}
          disabled={isLoading}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-fg font-semibold text-sm hover:bg-primary-hover shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang kết nối...</span>
            </>
          ) : (
            <span>Tham gia cùng {inviterName}</span>
          )}
        </button>

        <Link
          href="/dashboard"
          className="inline-block text-xs font-medium text-text-muted hover:text-text transition-colors py-1"
        >
          Để sau
        </Link>
      </div>
    </div>
  );
}
