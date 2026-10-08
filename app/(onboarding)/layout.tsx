import React from 'react';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-bg text-text flex items-center justify-center p-4 sm:p-6 font-body">
      {children}
    </div>
  );
}
