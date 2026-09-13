import React, { ReactNode } from 'react';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
  className?: string;
}

export function EmptyState({ icon, title, description, action, actionLabel, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-surface border border-dashed border-border rounded-[var(--radius-lg)] ${className}`}>
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[var(--radius-full)] bg-surface-hover text-text-muted">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-xl font-heading font-semibold text-text">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-text-muted">{description}</p>
      )}
      {action && actionLabel && (
        <Button onClick={action} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
