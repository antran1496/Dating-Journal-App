'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { loginSchema, type LoginFormValues } from '@/types/forms';
import { AuthDivider, GoogleSignInButton } from '@/components/features/google-sign-in-button';

function mapOAuthError(code: string | string[] | undefined): string | null {
  if (typeof code !== 'string' || !code) return null;
  if (code === 'AccessDenied') return 'Tài khoản Google chưa xác thực email. Vui lòng thử tài khoản khác';
  if (code === 'CredentialsSignin') return null; // đã xử lý ở onSubmit
  return 'Đăng nhập Google thất bại. Vui lòng thử lại';
}

function mapAuthError(code: string | undefined): string {
  if (code === 'rate_limited') return 'Bạn đã thử quá nhiều lần. Vui lòng chờ ít phút rồi thử lại';
  if (code === 'invalid_credentials' || code === 'CredentialsSignin') return 'Email hoặc mật khẩu không chính xác';
  return 'Đăng nhập thất bại. Vui lòng thử lại';
}

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  // OAuth callback redirects here with `?error=...` on failure
  const { error: oauthErrorCode } = use(searchParams);
  const [error, setError] = useState<string | null>(() => mapOAuthError(oauthErrorCode));
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!res || res.error) {
        setError(mapAuthError(res?.code ?? res?.error));
        setIsLoading(false);
        return;
      }

      // Hard navigation ensures cookies are committed and server components re-render with fresh session on first attempt
      window.location.href = '/dashboard';
    } catch {
      setError('Đăng nhập thất bại. Vui lòng thử lại');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <GoogleSignInButton disabled={isLoading} onError={setError} />

      <AuthDivider text="hoặc đăng nhập bằng email" />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:focus:ring-rose-400/50 transition-all text-sm text-gray-900 dark:text-white disabled:opacity-50"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mật khẩu
          </label>
          <input
            {...register('password')}
            type="password"
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:focus:ring-rose-400/50 transition-all text-sm text-gray-900 dark:text-white disabled:opacity-50"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium rounded-xl shadow-lg shadow-rose-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang đăng nhập...</span>
          </>
        ) : (
          <span>Đăng nhập</span>
        )}
      </button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Chưa có tài khoản?{' '}
        <Link href="/signup" className="text-rose-600 dark:text-rose-400 hover:underline font-medium">
          Đăng ký ngay
        </Link>
      </p>
    </form>
  );
}
