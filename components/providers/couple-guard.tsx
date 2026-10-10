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
  const isSetupActionRoute = pathname === '/couple/setup' || pathname === '/couple/new' || pathname === '/couple/join';

  useEffect(() => {
    if (!isClient) return;
    if (!couple && !isCoupleSetupRoute) {
      router.replace('/couple/setup');
    } else if (couple && isSetupActionRoute) {
      router.replace('/dashboard');
    }
  }, [couple, isCoupleSetupRoute, isSetupActionRoute, router, isClient]);

  if (!couple && !isCoupleSetupRoute) {
    return null; // Return null to prevent flicker
  }

  if (couple && isSetupActionRoute) {
    return null;
  }

  return <>{children}</>;
}
