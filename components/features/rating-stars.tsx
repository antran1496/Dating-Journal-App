'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';

interface RatingStarsProps {
  value?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RatingStars({ value = 0, onChange, readonly = false, size = 'md', className = '' }: RatingStarsProps) {
  const [hovered, setHovered] = useState(0);

  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  const active = hovered || value;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-all duration-150 ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          }`}
          aria-label={`${star} sao`}
        >
          <Heart
            className={`${sizes[size]} transition-colors duration-150 ${
              star <= active
                ? 'fill-primary text-primary'
                : 'fill-transparent text-text-muted'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
