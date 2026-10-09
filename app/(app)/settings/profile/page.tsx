import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, User } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/features/profile-form';
import type { Profile } from '@/types';

export const metadata = {
  title: 'Hồ sơ cá nhân | Dating Journal',
};

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient(user);
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 -ml-2 text-text-muted hover:text-text rounded-full hover:bg-surface-hover transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Hồ sơ cá nhân
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5">
            Cập nhật tên hiển thị, ảnh đại diện và ngày sinh
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
        <ProfileForm profile={profile as Profile} />
      </div>
    </div>
  );
}
