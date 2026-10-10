'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';

interface GoogleSignInButtonProps {
  label?: string;
  disabled?: boolean;
  callbackUrl?: string;
  onError?: (message: string) => void;
}

function GoogleIcon() {
  // Official Google "G" brand colors — brand assets are exempt from theme tokens
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.95l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  label = 'Tiếp tục với Google',
  disabled = false,
  callbackUrl = '/dashboard',
  onError,
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch {
      onError?.('Không thể kết nối Google. Vui lòng thử lại');
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
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
      <span>{isLoading ? 'Đang chuyển đến Google...' : label}</span>
    </button>
  );
}

export function AuthDivider({ text = 'hoặc' }: { text?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-[var(--color-border)]" />
      <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">{text}</span>
      <div className="h-px flex-1 bg-[var(--color-border)]" />
    </div>
  );
}
