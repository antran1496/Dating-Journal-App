'use client';

import React from 'react';
import { X } from 'lucide-react';

export interface ChipProps {
  label: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'mood' | 'tag';
  size?: 'sm' | 'md';
  className?: string;
}

export function Chip({
  label,
  icon,
  selected = false,
  onClick,
  onDelete,
  disabled = false,
  variant = 'default',
  size = 'md',
  className = '',
}: ChipProps) {
  const isClickable = Boolean(onClick);

  const sizeStyles = {
    sm: 'min-h-[32px] px-2.5 py-1 text-xs gap-1',
    md: 'min-h-[38px] px-3.5 py-1.5 text-sm gap-1.5',
  };

  const variantStyles = {
    default: selected
      ? 'bg-primary/10 border-primary text-primary font-semibold'
      : 'bg-surface border-border text-text hover:bg-surface-hover',
    mood: selected
      ? 'bg-primary/15 border-primary text-primary shadow-sm font-semibold scale-105'
      : 'bg-surface border-border/80 text-text hover:border-primary/50',
    tag: selected
      ? 'bg-primary text-white border-transparent'
      : 'bg-surface-hover/70 border-transparent text-text-muted hover:text-text',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={isClickable ? selected : undefined}
      className={`inline-flex items-center justify-center rounded-full border transition-all duration-200 select-none ${
        sizeStyles[size]
      } ${variantStyles[variant]} ${
        isClickable ? 'cursor-pointer active:scale-95' : 'cursor-default'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {icon && <span className="flex-shrink-0 text-base leading-none">{icon}</span>}
      <span className="truncate">{label}</span>
      {onDelete && (
        <span
          role="button"
          tabIndex={0}
          aria-label={`Xoá ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-1 -mr-1 p-0.5 rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </span>
      )}
    </button>
  );
}
