import React from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function DateDetailLoading() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      {/* Image skeleton */}
      <LoadingSkeleton variant="rect" className="h-64 w-full" />
      
      {/* Content wrapper */}
      <div className="space-y-6 px-4 py-2">
        {/* Title skeleton */}
        <div className="space-y-3">
          <LoadingSkeleton variant="text" className="w-3/4 h-8" />
          <div className="flex items-center gap-3">
            <LoadingSkeleton variant="rect" className="w-24 h-6 rounded-[var(--radius-full)]" />
            <LoadingSkeleton variant="rect" className="w-32 h-6 rounded-[var(--radius-full)]" />
          </div>
        </div>

        {/* Text lines skeleton */}
        <div className="space-y-3 pt-4">
          <LoadingSkeleton variant="text" className="w-full h-4" />
          <LoadingSkeleton variant="text" className="w-full h-4" />
          <LoadingSkeleton variant="text" className="w-4/5 h-4" />
        </div>
      </div>
    </div>
  );
}
