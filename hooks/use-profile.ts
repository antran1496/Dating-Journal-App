'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useSessionUser } from '@/components/providers/session-provider';
import { keys as queryKeys } from '@/lib/query/keys';
import { getProfile } from '@/lib/queries/profile';
import type { Profile } from '@/types';

export function useProfile() {
  const supabase = createClient();
  const { user } = useSessionUser();

  const query = useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      return getProfile(supabase, user.id);
    },
    enabled: !!user,
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
