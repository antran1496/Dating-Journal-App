import React from 'react';
import { BackButton } from '@/components/ui/back-button';

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  showBack?: boolean;
  backHref?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  showBack = false,
  backHref,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`flex flex-col gap-2 pb-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && <BackButton fallback={backHref} />}
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-text truncate">
            {title}
          </h1>
        </div>
        {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
      </div>
      {description && (
        <p className="text-sm sm:text-base text-text-muted leading-relaxed">
          {description}
        </p>
      )}
    </header>
  );
}
