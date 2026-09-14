import React from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function DatesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <LoadingSkeleton variant="text" width={180} height={28} />
          <LoadingSkeleton variant="text" width={120} height={16} />
        </div>
        <LoadingSkeleton variant="rect" width={120} height={40} className="rounded-[var(--radius-md)]" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-3 rounded-[var(--radius-lg)] bg-surface border border-border">
            <LoadingSkeleton variant="rect" width={100} height={80} className="rounded-[var(--radius-md)] shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <LoadingSkeleton variant="text" width="60%" height={20} />
              <LoadingSkeleton variant="text" width="40%" height={14} />
              <LoadingSkeleton variant="text" width="25%" height={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
