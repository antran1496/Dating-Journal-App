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

  const isCoupleSetupRoute = pathname.startsWith('/couple');

  useEffect(() => {
    if (!isClient) return;
    if (!couple && !isCoupleSetupRoute) {
      router.replace('/couple/setup');
    }
  }, [couple, isCoupleSetupRoute, router, isClient]);

  if (!couple && !isCoupleSetupRoute) {
    return null; // Return null to prevent flicker
  }

  return <>{children}</>;
}
