'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { loginSchema, type LoginFormValues } from '@/types/forms';
import { GoogleSignInButton, AuthDivider } from '@/components/features/google-sign-in-button';
import { AppleSignInButton } from '@/components/features/apple-sign-in-button';

function mapOAuthError(code: string | string[] | undefined): string | null {
  if (typeof code !== 'string' || !code) return null;
  if (code === 'AccessDenied') return 'Tài khoản chưa được xác thực email. Vui lòng thử phương thức khác';
  if (code === 'CredentialsSignin') return null;
  return 'Đăng nhập không thành công. Vui lòng thử lại';
}

function mapAuthError(code: string | undefined): string {
  if (code === 'rate_limited') return 'Bạn đã thử quá nhiều lần. Vui lòng chờ ít phút rồi thử lại';
  if (code === 'invalid_credentials' || code === 'CredentialsSignin') return 'Email hoặc mật khẩu không chính xác';
  return 'Đăng nhập thất bại. Vui lòng thử lại';
}

interface LoginPageProps {
  searchParams: Promise<{ error?: string; next?: string }>;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = use(searchParams);
  const oauthErrorCode = resolvedParams.error;
  const nextUrl = resolvedParams.next || '/dashboard';

  const [error, setError] = useState<string | null>(() => mapOAuthError(oauthErrorCode));
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onPasswordSubmit = async (data: LoginFormValues) => {
    setError(null);
    setIsPasswordLoading(true);

    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!res || res.error) {
        setError(mapAuthError(res?.code ?? res?.error));
        setIsPasswordLoading(false);
        return;
      }

      window.location.href = nextUrl;
    } catch {
      setError('Đăng nhập thất bại. Vui lòng thử lại');
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text mb-1.5">
          Chào bạn quay lại
        </h1>
        <p className="text-sm text-text-muted">
          Đăng nhập để mở không gian của hai bạn.
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
          label="Tiếp tục với Google"
          disabled={isPasswordLoading}
          callbackUrl={nextUrl}
          onError={setError}
        />
        <AppleSignInButton
          label="Tiếp tục với Apple"
          disabled={isPasswordLoading}
          callbackUrl={nextUrl}
          onError={setError}
        />
      </div>

      <AuthDivider text="hoặc đăng nhập bằng email" />

      {/* Form Mật khẩu */}
      <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="login-email">
            Email
          </label>
          <input
            {...register('email')}
            id="login-email"
            type="email"
            disabled={isPasswordLoading}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="login-password">
            Mật khẩu
          </label>
          <input
            {...register('password')}
            id="login-password"
            type="password"
            disabled={isPasswordLoading}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPasswordLoading}
          className="w-full h-11 px-4 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-fg font-semibold text-sm hover:bg-primary-hover shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPasswordLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            <span>Đăng nhập</span>
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      <div className="pt-2">
        <Link
          href={`/signup${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`}
          className="inline-block text-xs font-medium text-text hover:text-primary transition-colors"
        >
          Chưa có tài khoản? <span className="text-primary font-semibold underline">Đăng ký ngay</span>
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
