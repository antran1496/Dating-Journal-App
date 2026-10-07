'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { CoupleWithMembers } from '@/types';
import { useIsClient } from '@/hooks/use-is-client';

export function CoupleGuard({ 
  couple, 
  children 
}: { 
  couple: CoupleWithMembers | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isClient = useIsClient();

  useEffect(() => {
    if (!isClient) return;
    if (!couple && pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [couple, pathname, router, isClient]);

  if (!couple && pathname !== '/onboarding') {
    return null; // Return null to prevent flicker
  }

  return <>{children}</>;
}
