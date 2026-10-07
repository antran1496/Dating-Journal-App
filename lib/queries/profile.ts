import { SupabaseClient } from '@supabase/supabase-js';
import type { Profile, UserPreferences } from '@/types';

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('getProfile error:', error);
    return null;
  }
  return data as Profile | null;
}

export async function getPreferences(supabase: SupabaseClient, userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('profile_id', userId)
    .maybeSingle();

  if (error) {
    console.error('getPreferences error:', error);
    return null;
  }
  return data as UserPreferences | null;
}
