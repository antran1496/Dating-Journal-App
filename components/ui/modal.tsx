'use client';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity p-4">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div 
        className={`relative w-full ${sizeClasses[size]} rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-elevated)] border border-border animate-in fade-in slide-in-from-bottom-4 duration-250 ease-out flex flex-col max-h-[90vh]`}
        role="dialog"
        aria-modal="true"
      >
        {(
          <div className="flex items-center justify-between border-b border-border p-4">
            {title && <h2 className="text-lg font-heading font-semibold text-text">{title}</h2>}
            <button
              onClick={onClose}
              className="rounded-[var(--radius-full)] p-1.5 text-text-muted hover:bg-surface-hover hover:text-text transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
