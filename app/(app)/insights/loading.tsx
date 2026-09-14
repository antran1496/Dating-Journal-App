import React from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function InsightsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <LoadingSkeleton variant="text" width={220} height={28} />
        <LoadingSkeleton variant="text" width={280} height={16} />
      </div>
      <LoadingSkeleton variant="rect" height={44} className="rounded-[var(--radius-md)]" />
      <div className="rounded-[var(--radius-lg)] bg-surface border border-border p-8 space-y-6">
        <LoadingSkeleton variant="text" width="40%" height={24} className="mx-auto" />
        <div className="flex justify-center">
          <LoadingSkeleton variant="circle" width={96} height={96} />
        </div>
        <LoadingSkeleton variant="rect" width={200} height={40} className="mx-auto rounded-[var(--radius-md)]" />
      </div>
    </div>
  );
}
