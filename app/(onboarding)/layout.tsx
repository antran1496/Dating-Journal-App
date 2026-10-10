import React from 'react';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient(user);
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.onboarded_at) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-bg text-text flex items-center justify-center p-4 sm:p-6 font-body">
      {children}
    </div>
  );
}
