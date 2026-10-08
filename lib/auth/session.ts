import 'server-only';
import { cache } from 'react';
import { auth } from '@/auth';
import type { AppUser } from '@/types/auth';

export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  return id ? { id, email: session.user.email ?? null } : null;
});
