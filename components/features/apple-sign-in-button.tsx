'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';

interface AppleSignInButtonProps {
  label?: string;
  disabled?: boolean;
  callbackUrl?: string;
  onError?: (message: string) => void;
}

function AppleIcon() {
  return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.71-.93 2.73 1 .08 2.02-.48 2.64-1.23z" />
    </svg>
  );
}

export function AppleSignInButton({
  label = 'Tiếp tục với Apple',
  disabled = false,
  callbackUrl = '/dashboard',
  onError,
}: AppleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await signIn('apple', { callbackUrl });
    } catch {
      onError?.('Không thể kết nối Apple. Vui lòng thử lại');
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="w-full py-3 px-4 flex items-center justify-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] font-medium text-sm shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <AppleIcon />}
      <span>{isLoading ? 'Đang chuyển đến Apple...' : label}</span>
    </button>
  );
}
