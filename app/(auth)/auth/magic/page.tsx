'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Heart, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface MagicPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default function MagicAuthPage({ searchParams }: MagicPageProps) {
  const resolvedParams = use(searchParams);
  const token = resolvedParams.token;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn('magic-link', {
        token,
        redirect: false,
      });

      if (res?.error) {
        setError('Liên kết này đã hết hạn (sau 15 phút) hoặc đã được sử dụng. Vui lòng yêu cầu link mới nhé.');
        setIsLoading(false);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-8 shadow-[var(--shadow-card)] text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text mb-2">Liên kết không hợp lệ</h1>
          <p className="text-sm text-text-muted mb-6">
            Không tìm thấy mã xác thực. Vui lòng gửi lại link đăng nhập từ trang Đăng nhập.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-11 px-6 rounded-[var(--radius-md)] bg-primary text-primary-fg font-medium text-sm hover:bg-primary-hover shadow-sm transition-colors"
          >
            Về trang đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-8 shadow-[var(--shadow-card)] text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
          <Heart className="w-7 h-7 fill-primary" />
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text mb-2">
          Chào bạn quay lại 💗
        </h1>
        <p className="text-sm text-text-muted mb-6">
          Nhấn nút bên dưới để mở không gian riêng của hai đứa ✨
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-[var(--radius-md)] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-left flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 leading-relaxed">
              {error}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary text-primary-fg font-semibold text-base hover:bg-primary-hover shadow-[var(--shadow-glow)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang mở không gian...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Vào app ngay</span>
            </>
          )}
        </button>

        <div className="mt-6 pt-4 border-t border-border">
          <Link
            href="/login"
            className="text-xs text-text-muted hover:text-text transition-colors"
          >
            Hoặc đăng nhập bằng phương thức khác
          </Link>
        </div>
      </div>
    </div>
  );
}
