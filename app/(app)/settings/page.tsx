import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { SettingsDashboard } from './settings-dashboard';
import type { Profile, CoupleWithMembers } from '@/types';

export const metadata = {
  title: 'Cài đặt | Dating Journal',
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  const supabase = await createClient(user);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  const { data: memberData } = await supabase
    .from('couple_members')
    .select(`
      couple_id, nickname, role,
      couple:couples(
        id, invite_code, anniversary_date, relationship_status, created_by, created_at,
        couple_members(couple_id, profile_id, nickname, role, profile:profiles(*))
      )
    `)
    .eq('profile_id', user.id)
    .maybeSingle();

  const couple = memberData?.couple as unknown as CoupleWithMembers | null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text">Cài đặt ⚙️</h1>
        <p className="text-text-muted mt-1">Quản lý tài khoản và tùy chỉnh ứng dụng</p>
      </div>
      <SettingsDashboard profile={profile as Profile} couple={couple} userId={user.id} />
    </div>
  );
}
