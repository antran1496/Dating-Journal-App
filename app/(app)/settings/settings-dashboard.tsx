'use client';

import React, { useState } from 'react';
import { User, Palette } from 'lucide-react';
import type { Profile, CoupleWithMembers } from '@/types';
import { ProfileClient } from './profile-settings';
import ThemeSettingsClient from './theme-settings';

interface SettingsDashboardProps {
  profile: Profile;
  couple: CoupleWithMembers | null;
  userId: string;
}

export function SettingsDashboard({ profile, couple, userId }: SettingsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'theme'>('profile');

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
          <User size={16} /> Hồ sơ
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'theme' ? 'bg-surface shadow-sm text-text' : 'text-text-muted hover:text-text'
          }`}
        >
          <Palette size={16} /> Giao diện
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
    </div>
  );
}
