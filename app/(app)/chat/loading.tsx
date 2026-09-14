import React from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function ChatLoading() {
  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)] min-h-[600px]">
      {/* Sessions sidebar skeleton */}
      <div className="w-full md:w-64 shrink-0 space-y-3">
        <LoadingSkeleton variant="rect" height={40} className="rounded-[var(--radius-md)]" />
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="rect" height={44} className="rounded-[var(--radius-md)]" />
        ))}
      </div>
      {/* Chat area skeleton */}
      <div className="flex-1 rounded-[var(--radius-lg)] border border-border bg-surface overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <LoadingSkeleton variant="circle" width={40} height={40} />
          <div className="space-y-1">
            <LoadingSkeleton variant="text" width={100} height={20} />
            <LoadingSkeleton variant="text" width={160} height={14} />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
              <LoadingSkeleton variant="circle" width={32} height={32} className="shrink-0" />
              <LoadingSkeleton variant="rect" width={i % 2 === 0 ? '60%' : '40%'} height={60} className="rounded-2xl" />
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border">
          <LoadingSkeleton variant="rect" height={44} className="rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
