'use client';

import React from 'react';
import { SettingsIndex } from '@/components/features/settings-index';
import { useProfile } from '@/hooks/use-profile';
import { useCouple } from '@/hooks/use-couple';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function SettingsPage() {
  const { profile, isLoading: isLoadingProfile } = useProfile();
  const { couple, isLoading: isLoadingCouple } = useCouple();

  if (isLoadingProfile || !profile) {
    return (
      <div className="max-w-xl mx-auto space-y-6 pb-12">
        <div className="space-y-1">
          <LoadingSkeleton variant="text" width="160px" height="32px" />
          <LoadingSkeleton variant="text" width="280px" height="18px" />
        </div>
        <div className="space-y-4">
          <LoadingSkeleton variant="rect" height="120px" className="rounded-[var(--radius-xl)]" />
          <LoadingSkeleton variant="rect" height="200px" className="rounded-[var(--radius-xl)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold text-text">Cài đặt ⚙️</h1>
        <p className="text-text-muted text-sm">Quản lý tài khoản, giao diện và bảo mật của bạn</p>
      </div>
      <SettingsIndex profile={profile} couple={couple ?? null} />
    </div>
  );
}
