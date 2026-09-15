import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/layouts/app-sidebar';
import { ThemeApplier } from '@/components/providers/theme-applier';
import { LocaleProvider } from '@/components/providers/locale-provider';
import type { Profile, UserPreferences } from '@/types';
import type { Locale } from '@/lib/i18n/translations';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch profile and preferences in parallel
  const [{ data: profile }, { data: preferences }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('user_preferences')
      .select('*')
      .eq('profile_id', user.id)
      .maybeSingle(),
  ]);

  const prefs = preferences as UserPreferences | null;
  const initialLocale: Locale = (prefs?.locale as Locale) ?? 'vi';

  return (
    <LocaleProvider initialLocale={initialLocale}>
      <div className="min-h-screen bg-bg text-text flex flex-col">
        {/* Client component that applies initial preferences to ThemeProvider */}
        <ThemeApplier preferences={prefs} />

        <AppSidebar profile={profile as Profile | null} />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-accent/3 -z-10 pointer-events-none" />
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </LocaleProvider>
  );
}

