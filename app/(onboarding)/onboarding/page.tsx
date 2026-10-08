'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Loader2, Heart, Check, AlertCircle, ShieldAlert } from 'lucide-react';

const PALETTES = [
  { name: 'Hồng ấm', hex: '#ff6b81' },
  { name: 'Đỏ hồng', hex: '#f43f5e' },
  { name: 'Tím thơ', hex: '#a855f7' },
  { name: 'Cam ngọt', hex: '#f97316' },
  { name: 'Xanh ngọc', hex: '#14b8a6' },
  { name: 'Hồng phấn', hex: '#ec4899' },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('2005-01-01');
  const [selectedColor, setSelectedColor] = useState('#ff6b81');
  const [consent, setConsent] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnderage, setIsUnderage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setErrorMessage('Bạn cần đồng ý lưu trữ riêng tư để tiếp tục.');
      return;
    }
    if (!displayName.trim()) {
      setErrorMessage('Vui lòng nhập tên hiển thị.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/profile/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim(),
          birth_date: birthDate,
          primary_color: selectedColor,
          consent: true,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.error === 'underage') {
          setIsUnderage(true);
        } else {
          setErrorMessage(data.message || 'Không thể lưu thông tin. Vui lòng thử lại.');
        }
        setIsLoading(false);
        return;
      }

      // Chuyển hướng tới bước chọn couple
      router.push('/couple/setup');
      router.refresh();
    } catch {
      setErrorMessage('Đã xảy ra lỗi mạng. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  if (isUnderage) {
    return (
      <div className="w-full max-w-lg rounded-[28px] border border-border bg-surface p-8 sm:p-10 shadow-[var(--shadow-elevated)] text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text mb-3">
          Hẹn gặp lại bạn khi đủ 16 tuổi nhé!
        </h1>

        <p className="text-sm text-text-muted leading-relaxed mb-8">
          Dating Journal là không gian riêng tư được thiết kế dành cho các bạn từ đủ 16 tuổi trở lên.
          Hiện tại bạn chưa đủ điều kiện độ tuổi để kích hoạt tài khoản.
        </p>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full h-12 flex items-center justify-center rounded-xl border border-border bg-surface hover:bg-surface-hover text-text font-semibold text-sm transition-colors"
        >
          Đăng xuất tài khoản
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg rounded-[28px] border border-border bg-surface p-8 sm:p-10 shadow-[var(--shadow-elevated)]">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6" aria-label="Bước 1 trên 2">
        <div className="h-1.5 w-10 rounded-full bg-primary" />
        <div className="h-1.5 w-10 rounded-full bg-border" />
      </div>

      <div className="mb-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text mb-1.5">
          Mình làm quen một chút nhé
        </h1>
        <p className="text-sm text-text-muted">
          Chỉ hỏi những gì cần thiết để đồng hành cùng hai bạn.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="ob-name">
            Tên hiển thị
          </label>
          <input
            id="ob-name"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isLoading}
            placeholder="Ví dụ: Minh Anh"
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="ob-dob">
            Ngày sinh
          </label>
          <input
            id="ob-dob"
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            disabled={isLoading}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
          />
          <p className="mt-1 text-[11px] text-text-muted">
            Dùng để kiểm tra độ tuổi, tính thần số học và cung hoàng đạo.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-2">
            Màu chủ đạo (đổi được sau)
          </label>
          <div className="flex flex-wrap gap-3">
            {PALETTES.map((p) => {
              const isSelected = selectedColor === p.hex;
              return (
                <button
                  key={p.hex}
                  type="button"
                  onClick={() => setSelectedColor(p.hex)}
                  title={p.name}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'opacity-85 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: p.hex }}
                >
                  {isSelected && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-primary border-border focus:ring-primary"
            />
            <span className="text-xs text-text-muted leading-relaxed">
              Mình đồng ý cho Dating Journal lưu ảnh và ghi chú của hai bạn ở chế độ riêng tư.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading || !consent}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-fg font-semibold text-sm hover:bg-primary-hover shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang lưu thông tin...</span>
            </>
          ) : (
            <>
              <Heart className="w-4 h-4" />
              <span>Tiếp tục</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
