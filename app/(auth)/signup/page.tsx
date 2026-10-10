'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { signupSchema, type SignupFormValues } from '@/types/forms';
import { GoogleSignInButton, AuthDivider } from '@/components/features/google-sign-in-button';
import { AppleSignInButton } from '@/components/features/apple-sign-in-button';

function mapSignupError(code: string | undefined): string {
  if (code === 'email_taken') {
    return 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác';
  }
  if (code === 'rate_limited') {
    return 'Bạn đã thử quá nhiều lần. Vui lòng chờ ít phút rồi thử lại';
  }
  if (code === 'invalid_input') {
    return 'Thông tin không hợp lệ. Mật khẩu từ 6 đến 72 ký tự';
  }
  return 'Đăng ký thất bại. Vui lòng thử lại';
}

interface SignupPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  const resolvedParams = use(searchParams);
  const nextUrl = resolvedParams.next || '/dashboard';

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: data.display_name,
          email: data.email,
          password: data.password,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(mapSignupError(json.code));
        setIsLoading(false);
        return;
      }

      const login = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      window.location.href = login?.error ? '/login' : nextUrl;
    } catch {
      setError('Đăng ký thất bại. Vui lòng thử lại');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text mb-1.5">
          Tạo tài khoản mới
        </h1>
        <p className="text-sm text-text-muted">
          Bắt đầu lưu giữ những khoảnh khắc đẹp cùng nhau.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* OAuth Buttons */}
      <div className="space-y-2.5">
        <GoogleSignInButton
          label="Đăng ký với Google"
          disabled={isLoading}
          callbackUrl={nextUrl}
          onError={setError}
        />
        <AppleSignInButton
          label="Đăng ký với Apple"
          disabled={isLoading}
          callbackUrl={nextUrl}
          onError={setError}
        />
      </div>

      <AuthDivider text="hoặc đăng ký bằng email" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="signup-name">
            Tên của bạn
          </label>
          <input
            {...register('display_name')}
            id="signup-name"
            type="text"
            disabled={isLoading}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            placeholder="Ví dụ: Minh Anh"
          />
          {errors.display_name && (
            <p className="mt-1 text-xs text-red-500">{errors.display_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="signup-email">
            Email
          </label>
          <input
            {...register('email')}
            id="signup-email"
            type="email"
            disabled={isLoading}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="signup-password">
            Mật khẩu
          </label>
          <input
            {...register('password')}
            id="signup-password"
            type="password"
            disabled={isLoading}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            placeholder="Tối thiểu 6 ký tự"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="signup-confirm-password">
            Xác nhận mật khẩu
          </label>
          <input
            {...register('confirm_password')}
            id="signup-confirm-password"
            type="password"
            disabled={isLoading}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            placeholder="Nhập lại mật khẩu"
          />
          {errors.confirm_password && (
            <p className="mt-1 text-xs text-red-500">{errors.confirm_password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 px-4 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-fg font-semibold text-sm hover:bg-primary-hover shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang tạo tài khoản...</span>
            </>
          ) : (
            <span>Tạo tài khoản</span>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="pt-2">
        <Link
          href={`/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`}
          className="inline-block text-xs font-medium text-text hover:text-primary transition-colors"
        >
          Đã có tài khoản? <span className="text-primary font-semibold underline">Đăng nhập</span>
        </Link>
      </div>

      {/* Legal & Age compliance notice */}
      <p className="text-[11px] leading-relaxed text-text-muted border-t border-border pt-4">
        Tiếp tục nghĩa là bạn đồng ý với{' '}
        <Link href="/terms" className="underline hover:text-text">
          Điều khoản
        </Link>{' '}
        và{' '}
        <Link href="/privacy" className="underline hover:text-text">
          Chính sách quyền riêng tư
        </Link>
        . Ứng dụng dành cho người từ 16 tuổi.
      </p>
    </div>
  );
}
