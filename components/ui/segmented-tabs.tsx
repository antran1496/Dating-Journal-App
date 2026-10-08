'use client';

import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedTabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedTabs({
  tabs,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
}: SegmentedTabsProps) {
  const sizeStyles = {
    sm: 'text-xs py-1.5 px-3 min-h-[36px]',
    md: 'text-sm py-2 px-4 min-h-[42px]',
  };

  return (
    <div
      role="tablist"
      className={`inline-flex items-center p-1 bg-surface-hover/70 border border-border rounded-full ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isSelected = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isSelected}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center justify-center gap-1.5 font-medium rounded-full transition-all duration-200 cursor-pointer ${
              fullWidth ? 'flex-1' : ''
            } ${sizeStyles[size]} ${
              isSelected
                ? 'bg-surface text-primary shadow-sm font-semibold'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
