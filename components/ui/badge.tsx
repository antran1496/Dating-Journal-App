import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  dot?: boolean;
}

export function Badge({ variant = 'default', dot = false, className = '', children, ...rest }: BadgeProps) {
  const variants = {
    default: 'bg-surface-hover text-text border-border',
    success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20',
    warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    error: 'bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20',
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  };

  const dotColors = {
    default: 'bg-text-muted',
    success: 'bg-[var(--color-success)]',
    warning: 'bg-yellow-500',
    error: 'bg-[var(--color-error)]',
    info: 'bg-blue-500',
  };

  return (
    <div
      className={`inline-flex items-center rounded-[var(--radius-full)] border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}
      {...rest}
    >
      {dot && (
        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </div>
  );
}
