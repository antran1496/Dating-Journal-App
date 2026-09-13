import React from 'react';

export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
}

export function LoadingSkeleton({ variant = 'rect', width, height, className = '', ...rest }: LoadingSkeletonProps) {
  const styles = {
    text: 'rounded-[var(--radius-sm)] h-4 w-full',
    circle: 'rounded-[var(--radius-full)] aspect-square',
    rect: 'rounded-[var(--radius-md)] w-full h-full min-h-[20px]',
  };

  return (
    <div
      className={`bg-surface-hover overflow-hidden relative ${styles[variant]} ${className}`}
      style={{ width, height }}
      {...rest}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-black/10 to-transparent" />
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
