'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { UserPreferences } from '@/types';
import { getDefaultPreferences } from '@/lib/theme/theme-presets';
import { useSessionUser } from '@/components/providers/session-provider';

export const PREFERENCES_QUERY_KEYS = {
  current: ['user-preferences'] as const,
};

export function useUserPreferences() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useSessionUser();

  const query = useQuery({
    queryKey: PREFERENCES_QUERY_KEYS.current,
    queryFn: async (): Promise<UserPreferences | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[useUserPreferences] fetch error:', error);
        return null;
      }

      return data as UserPreferences | null;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<UserPreferences, 'profile_id'>>) => {
      if (!user) throw new Error('Chưa đăng nhập');

      const defaults = getDefaultPreferences();
      const payload = {
        profile_id: user.id,
        ...defaults,
        ...query.data,
        ...updates,
      };

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(payload, { onConflict: 'profile_id' })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as UserPreferences;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(PREFERENCES_QUERY_KEYS.current, updated);
    },
  });

  const preferences: UserPreferences | null = query.data ?? null;

  return {
    preferences,
    isLoading: query.isLoading,
    error: query.error,
    updatePreferences: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
