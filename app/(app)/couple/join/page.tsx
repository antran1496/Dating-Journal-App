'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Heart, AlertCircle, Link2 } from 'lucide-react';

export default function CoupleJoinPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
    if (cleanCode.length !== 6) {
      setError('Mã mời gồm đúng 6 ký tự');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/invites/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.message || 'Mã mời không đúng hoặc đã hết hạn.');
        setIsLoading(false);
        return;
      }

      // Tham gia thành công → chuyển vào dashboard
      window.location.href = '/dashboard';
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-6rem)] py-6 sm:py-10">
      <div className="w-full max-w-lg rounded-[28px] border border-border bg-surface p-8 sm:p-10 shadow-[var(--shadow-elevated)]">
        <Link
          href="/couple/setup"
          className="inline-flex items-center gap-2 text-xs font-medium text-text-muted hover:text-text mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại lựa chọn
        </Link>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
            <Link2 className="w-6 h-6" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text mb-1.5">
            Nhập mã mời
          </h1>
          <p className="text-sm text-text-muted">
            Mã gồm 6 ký tự do người yêu gửi cho bạn.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-text mb-2 text-center" htmlFor="join-code">
              Mã 6 ký tự
            </label>
            <input
              id="join-code"
              type="text"
              required
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={isLoading}
              placeholder="K3X9MA"
              className="w-full h-14 px-4 rounded-2xl border-2 border-border bg-surface text-center font-heading text-2xl sm:text-3xl font-black uppercase tracking-[0.3em] text-primary focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || code.trim().length !== 6}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-fg font-semibold text-sm hover:bg-primary-hover shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kết nối...</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 fill-primary-fg" />
                <span>Tham gia ngay</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
