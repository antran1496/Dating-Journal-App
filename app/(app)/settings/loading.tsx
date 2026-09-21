import React from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full">
      <div className="mb-6 space-y-2">
        <LoadingSkeleton variant="text" className="w-32 h-8" />
        <LoadingSkeleton variant="text" className="w-64 h-4" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 md:p-6 rounded-[var(--radius-lg)] bg-surface border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2 w-1/2">
                <LoadingSkeleton variant="text" className="w-1/2 h-5" />
                <LoadingSkeleton variant="text" className="w-3/4 h-3.5" />
              </div>
              <LoadingSkeleton variant="rect" className="w-16 h-8 rounded-[var(--radius-full)]" />
            </div>
            {i % 2 === 0 && (
               <div className="pt-2">
                 <LoadingSkeleton variant="rect" className="w-full h-10" />
               </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
