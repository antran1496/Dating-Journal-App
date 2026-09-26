'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { signupSchema, type SignupFormValues } from '@/types/forms';

function mapSignupError(message: string): string {
  if (message.includes('User already registered') || message.includes('already exists')) {
    return 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác';
  }
  if (message.includes('Password should be at least')) {
    return 'Mật khẩu phải có ít nhất 6 ký tự';
  }
  if (message.includes('Too many requests') || message.includes('rate limit')) {
    return 'Bạn đã thử quá nhiều lần. Vui lòng chờ ít phút rồi thử lại';
  }
  return message || 'Đăng ký thất bại. Vui lòng thử lại';
}

export default function SignupPage() {
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
      const supabase = createClient();
      
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(mapSignupError(authError.message));
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // 2. Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            display_name: data.display_name,
          });
          
        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
        
        // Hard navigation ensures cookies are committed and server components re-render with fresh session on first attempt
        window.location.href = '/dashboard';
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Đăng ký thất bại. Vui lòng thử lại');
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

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tên của bạn
          </label>
          <input
            {...register('display_name')}
            type="text"
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:focus:ring-rose-400/50 transition-all text-sm text-gray-900 dark:text-white disabled:opacity-50"
            placeholder="Ví dụ: Minh Anh"
          />
          {errors.display_name && (
            <p className="mt-1 text-sm text-red-500">{errors.display_name.message}</p>
          )}
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Xác nhận mật khẩu
          </label>
          <input
            {...register('confirm_password')}
            type="password"
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:focus:ring-rose-400/50 transition-all text-sm text-gray-900 dark:text-white disabled:opacity-50"
            placeholder="••••••••"
          />
          {errors.confirm_password && (
            <p className="mt-1 text-sm text-red-500">{errors.confirm_password.message}</p>
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
            <span>Đang tạo tài khoản...</span>
          </>
        ) : (
          <span>Đăng ký</span>
        )}
      </button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Đã có tài khoản?{' '}
        <Link href="/login" className="text-rose-600 dark:text-rose-400 hover:underline font-medium">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
