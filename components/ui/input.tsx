import React, { forwardRef, ReactNode } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, icon, iconPosition = 'left', id, ...rest }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 text-text-muted flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`flex h-10 w-full rounded-[var(--radius-md)] border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-250 ease-in-out disabled:cursor-not-allowed disabled:opacity-50
              ${error ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]' : 'border-border'}
              ${icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${icon && iconPosition === 'right' ? 'pr-10' : ''}
              ${className}
            `}
            {...rest}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 text-text-muted flex items-center pointer-events-none">
              {icon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p className={`text-xs ${error ? 'text-[var(--color-error)]' : 'text-text-muted'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
