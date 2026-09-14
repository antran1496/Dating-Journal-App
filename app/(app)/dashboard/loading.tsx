import React from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Counter skeleton */}
      <div className="flex flex-col items-center gap-4 py-8">
        <LoadingSkeleton variant="circle" width={120} height={120} />
        <LoadingSkeleton variant="text" width={200} height={24} />
        <LoadingSkeleton variant="text" width={160} height={16} />
      </div>
      {/* Milestone cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-[var(--radius-lg)] bg-surface border border-border space-y-3">
            <LoadingSkeleton variant="text" width="50%" height={16} />
            <LoadingSkeleton variant="text" width="80%" height={28} />
            <LoadingSkeleton variant="text" width="60%" height={14} />
          </div>
        ))}
      </div>
    </div>
  );
}
