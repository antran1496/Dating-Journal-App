'use client';
import React, { forwardRef, useEffect, useRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, maxLength, autoResize = false, id, onChange, ...rest }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;
    
    const inputId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    const handleResize = () => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };

    useEffect(() => {
      handleResize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rest.value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleResize();
      onChange?.(e);
    };

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            id={inputId}
            ref={textareaRef}
            maxLength={maxLength}
            onChange={handleChange}
            className={`flex min-h-[80px] w-full rounded-[var(--radius-md)] border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-250 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 resize-y
              ${error ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]' : 'border-border'}
              ${autoResize ? 'resize-none overflow-hidden' : ''}
              ${className}
            `}
            {...rest}
          />
          {maxLength && (
            <div className="absolute bottom-2 right-2 text-xs text-text-muted">
              {String(rest.value || '').length}/{maxLength}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-[var(--color-error)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
