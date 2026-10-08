import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/layouts/app-sidebar';
import { ThemeApplier } from '@/components/providers/theme-applier';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { SessionProvider } from '@/components/providers/session-provider';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getServerQueryClient } from '@/lib/query/get-server-query-client';
import { getProfile, getPreferences } from '@/lib/queries/profile';
import { getCouple } from '@/lib/queries/couple';
import { keys as queryKeys } from '@/lib/query/keys';
import type { Locale } from '@/lib/i18n/translations';
import { CacheWarmup } from '@/components/providers/cache-warmup';
import { CoupleGuard } from '@/components/providers/couple-guard';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  const supabase = await createClient(user);
  const queryClient = getServerQueryClient();

  // Fetch profile, preferences, and couple in parallel
  const [profile, preferences, couple] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: queryKeys.profile.me(),
      queryFn: () => getProfile(supabase, user.id),
    }),
    queryClient.fetchQuery({
      queryKey: queryKeys.preferences.me(),
      queryFn: () => getPreferences(supabase, user.id),
    }),
    queryClient.fetchQuery({
      queryKey: queryKeys.couple.current(),
      queryFn: () => getCouple(supabase, user.id),
    }),
  ]);

  if (!profile?.onboarded_at) {
    redirect('/onboarding');
  }

  const initialLocale: Locale = (preferences?.locale as Locale) ?? 'vi';

  return (
    <SessionProvider user={user}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <LocaleProvider initialLocale={initialLocale}>
          <div className="min-h-screen bg-bg text-text flex flex-col pt-safe md:pt-0">
            {/* Client component that applies initial preferences to ThemeProvider */}
            <ThemeApplier preferences={preferences} />

            <AppSidebar profile={profile} />

            <main className="flex-1 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-accent/3 -z-10 pointer-events-none" />
              <div className="max-w-5xl mx-auto p-4 md:p-8">
                <CoupleGuard couple={couple}>
                  <CacheWarmup couple={couple}>
                    {children}
                  </CacheWarmup>
                </CoupleGuard>
              </div>
            </main>
          </div>
        </LocaleProvider>
      </HydrationBoundary>
    </SessionProvider>
  );
}


