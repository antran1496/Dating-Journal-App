import React from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function CoupleSetupLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-md p-6 md:p-8 rounded-[var(--radius-lg)] bg-surface border border-border space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <LoadingSkeleton variant="circle" className="w-20 h-20" />
          <LoadingSkeleton variant="text" className="w-48 h-6" />
          <LoadingSkeleton variant="text" className="w-64 h-4" />
        </div>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <LoadingSkeleton variant="text" className="w-24 h-4" />
            <LoadingSkeleton variant="rect" className="w-full h-12" />
          </div>
          <div className="space-y-2">
            <LoadingSkeleton variant="text" className="w-24 h-4" />
            <LoadingSkeleton variant="rect" className="w-full h-12" />
          </div>
        </div>

        <div className="pt-2">
          <LoadingSkeleton variant="rect" className="w-full h-12" />
        </div>
      </div>
    </div>
  );
}
