'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Palette, LogOut, Shield, FileArchive, ChevronRight, Bell } from 'lucide-react';
import type { Profile, CoupleWithMembers } from '@/types';
import { ProfileClient } from './profile-settings';
import ThemeSettingsClient from './theme-settings';
import { signOut } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { clearSupabaseTokenCache } from '@/lib/supabase/client';
import { useLocale } from '@/components/providers/locale-provider';

interface SettingsDashboardProps {
  profile: Profile;
  couple: CoupleWithMembers | null;
  userId: string;
}

export function SettingsDashboard({ profile, couple, userId }: SettingsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'theme'>('profile');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useLocale();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    queryClient.clear();
    clearSupabaseTokenCache();
    await signOut({ redirect: false });
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

      {/* Quick Navigation Links */}
      <div className="space-y-2 pt-2">
        <Link
          href="/settings/privacy"
          className="flex items-center justify-between p-3.5 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Shield size={16} />
            </div>
            <div>
              <span className="font-semibold text-sm text-text block">Riêng tư & bảo mật</span>
              <span className="text-xs text-text-muted">Khoá app PIN, ẩn đa nhiệm, quyền xem dữ liệu</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-text-muted group-hover:text-text transition-colors" />
        </Link>

        <Link
          href="/settings/notifications"
          className="flex items-center justify-between p-3.5 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Bell size={16} />
            </div>
            <div>
              <span className="font-semibold text-sm text-text block">Thông báo đẩy</span>
              <span className="text-xs text-text-muted">Nhắc nhở cuối tuần, câu hỏi, giờ yên lặng</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-text-muted group-hover:text-text transition-colors" />
        </Link>

        <Link
          href="/settings/data"
          className="flex items-center justify-between p-3.5 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <FileArchive size={16} />
            </div>
            <div>
              <span className="font-semibold text-sm text-text block">Dữ liệu của bạn</span>
              <span className="text-xs text-text-muted">Xuất file ZIP kỷ niệm, rời couple, xoá tài khoản</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-text-muted group-hover:text-text transition-colors" />
        </Link>
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
