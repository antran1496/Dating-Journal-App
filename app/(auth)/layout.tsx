import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-rose-100 to-teal-50 dark:from-rose-950 dark:to-teal-900 relative overflow-y-auto p-4 sm:p-8 pt-safe pb-safe">
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-rose-300 dark:bg-rose-800 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-teal-300 dark:bg-teal-800 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md my-auto relative z-10">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-white/20 dark:border-white/10">
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              Dating Journal
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Nhật ký tình yêu riêng tư của hai bạn.
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
