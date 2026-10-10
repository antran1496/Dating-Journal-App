'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { loginSchema, type LoginFormValues } from '@/types/forms';
import { GoogleSignInButton, AuthDivider } from '@/components/features/google-sign-in-button';
import { AppleSignInButton } from '@/components/features/apple-sign-in-button';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';

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

  const [authMethod, setAuthMethod] = useState<'magic' | 'password'>('magic');
  const [error, setError] = useState<string | null>(() => mapOAuthError(oauthErrorCode));
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Magic link state
  const [magicEmail, setMagicEmail] = useState('');
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [magicSentMessage, setMagicSentMessage] = useState<string | null>(null);
  const [magicCooldown, setMagicCooldown] = useState(0);

  useEffect(() => {
    if (magicCooldown <= 0) return;
    const timer = setInterval(() => {
      setMagicCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [magicCooldown]);

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

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicEmail.trim() || magicCooldown > 0) return;

    setError(null);
    setIsMagicLoading(true);
    setMagicSentMessage(null);

    try {
      const res = await fetch('/api/auth/magic/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicEmail.trim() }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Không thể gửi link đăng nhập. Vui lòng thử lại.');
      } else {
        setMagicSentMessage(
          json.message || 'Mình đã gửi link vào email. Mở link để vào app nhé ✨ (hiệu lực 15 phút)'
        );
        setMagicCooldown(60);
      }
    } catch {
      setError('Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsMagicLoading(false);
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
          disabled={isPasswordLoading || isMagicLoading}
          callbackUrl={nextUrl}
          onError={setError}
        />
        <AppleSignInButton
          label="Tiếp tục với Apple"
          disabled={isPasswordLoading || isMagicLoading}
          callbackUrl={nextUrl}
          onError={setError}
        />
      </div>

      <AuthDivider text="hoặc dùng email" />

      {/* Tabs: Magic link vs Password */}
      <SegmentedTabs
        tabs={[
          { id: 'magic', label: 'Link qua email' },
          { id: 'password', label: 'Mật khẩu' },
        ]}
        value={authMethod}
        onChange={(val) => {
          setAuthMethod(val as 'magic' | 'password');
          setError(null);
        }}
        fullWidth
      />

      {authMethod === 'magic' ? (
        /* Form Link qua email */
        <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5" htmlFor="magic-email">
              Email của bạn
            </label>
            <input
              id="magic-email"
              type="email"
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
              disabled={isMagicLoading}
              required
              className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          {magicSentMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{magicSentMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isMagicLoading || magicCooldown > 0 || !magicEmail.trim()}
            className="w-full h-11 px-4 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-fg font-semibold text-sm hover:bg-primary-hover shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMagicLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang gửi link...</span>
              </>
            ) : magicCooldown > 0 ? (
              <span>Gửi lại sau {magicCooldown}s</span>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>Gửi link đăng nhập qua email</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* Form Mật khẩu */
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
            className="w-full h-11 px-4 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-fg font-semibold text-sm hover:bg-primary-hover shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
      )}

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
