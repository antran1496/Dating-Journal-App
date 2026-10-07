'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { UserPreferences } from '@/types';
import { getDefaultPreferences } from '@/lib/theme/theme-presets';
import { useSessionUser } from '@/components/providers/session-provider';
import { keys as queryKeys } from '@/lib/query/keys';
import { getPreferences } from '@/lib/queries/profile';

export function useUserPreferences() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useSessionUser();

  const query = useQuery({
    queryKey: queryKeys.preferences.me(),
    queryFn: async (): Promise<UserPreferences | null> => {
      if (!user) return null;
      return getPreferences(supabase, user.id);
    },
    enabled: !!user,
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
      queryClient.setQueryData(queryKeys.preferences.me(), updated);
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

