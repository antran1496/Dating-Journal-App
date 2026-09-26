'use client';

import React, { useState } from 'react';
import { User, Palette, LogOut } from 'lucide-react';
import type { Profile, CoupleWithMembers } from '@/types';
import { ProfileClient } from './profile-settings';
import ThemeSettingsClient from './theme-settings';
import { createClient } from '@/lib/supabase/client';
import { useLocale } from '@/components/providers/locale-provider';

interface SettingsDashboardProps {
  profile: Profile;
  couple: CoupleWithMembers | null;
  userId: string;
}

export function SettingsDashboard({ profile, couple, userId }: SettingsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'theme'>('profile');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const supabase = createClient();
  const { t } = useLocale();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex p-1 bg-surface-hover rounded-xl">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'profile' ? 'bg-surface shadow-sm text-text' : 'text-text-muted hover:text-text'
          }`}
        >
          <User size={16} /> {t('settings.profile')}
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'theme' ? 'bg-surface shadow-sm text-text' : 'text-text-muted hover:text-text'
          }`}
        >
          <Palette size={16} /> {t('settings.theme')}
        </button>
      </div>

      {/* Content */}
      <div className="pt-2 animate-[fadeIn_0.2s_ease-out]">
        {activeTab === 'profile' && (
          <ProfileClient profile={profile} couple={couple} userId={userId} />
        )}
        {activeTab === 'theme' && (
          <ThemeSettingsClient />
        )}
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-border">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius-md)] text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          <LogOut size={16} />
          {isLoggingOut ? t('settings.logging_out') : t('settings.logout')}
        </button>
      </div>
    </div>
  );
}
