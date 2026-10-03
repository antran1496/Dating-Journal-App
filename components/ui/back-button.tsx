'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallback?: string;
  className?: string;
  children?: React.ReactNode;
}

export function BackButton({ fallback = '/dates', className = '', children }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`flex items-center gap-2 text-text-muted hover:text-text transition-colors text-sm cursor-pointer ${className}`}
    >
      <ArrowLeft size={18} />
      {children ?? 'Quay lại'}
    </button>
  );
}
