import { SupabaseClient } from '@supabase/supabase-js';
import type { CoupleWithMembers } from '@/types';

export async function getCouple(supabase: SupabaseClient, userId: string): Promise<CoupleWithMembers | null> {
  const { data, error } = await supabase
    .from('couple_members')
    .select(`
      couple_id,
      nickname,
      role,
      couple:couples(
        id,
        invite_code,
        anniversary_date,
        relationship_status,
        created_by,
        created_at,
        couple_members(
          couple_id,
          profile_id,
          nickname,
          role,
          profile:profiles(
            id,
            display_name,
            avatar_url,
            birth_date,
            created_at
          )
        )
      )
    `)
    .eq('profile_id', userId)
    .maybeSingle();

  if (error) {
    console.error('getCouple error:', error);
    return null;
  }
  
  if (!data?.couple) return null;
  return data.couple as unknown as CoupleWithMembers;
}
