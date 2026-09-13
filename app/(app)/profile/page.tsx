import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileClient } from './profile-client';
import type { Profile, CoupleWithMembers } from '@/types';

export const metadata = {
  title: 'Hồ sơ | Dating Journal',
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch profile hiện tại
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  // Fetch couple với members
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

  return <ProfileClient profile={profile as Profile} couple={couple} userId={user.id} />;
}
