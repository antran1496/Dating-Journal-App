import React from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <LoadingSkeleton variant="text" width={200} height={28} />
          <LoadingSkeleton variant="text" width={140} height={16} />
        </div>
        <LoadingSkeleton variant="rect" width={120} height={40} className="rounded-[var(--radius-md)]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-lg)] bg-surface border border-border overflow-hidden">
            <LoadingSkeleton variant="rect" height={160} />
            <div className="p-4 space-y-3">
              <LoadingSkeleton variant="text" width="70%" height={20} />
              <LoadingSkeleton variant="text" width="50%" height={14} />
              <LoadingSkeleton variant="text" width="30%" height={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
