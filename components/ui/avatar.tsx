import React, { useState } from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline';
  className?: string;
}

export function Avatar({ src, alt, name, size = 'md', status, className = '' }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const statusSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className={`relative inline-flex shrink-0 rounded-full ${sizes[size]} ${className}`}>
      <div className="relative flex items-center justify-center overflow-hidden rounded-full aspect-square bg-surface-hover border border-border/50 shrink-0 w-full h-full">
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover rounded-full"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="font-medium text-text-muted select-none">{initials}</span>
        )}
      </div>
      {status && (
        <span 
          className={`absolute bottom-0 right-0 rounded-full border-2 border-surface ${statusSizes[size]} ${status === 'online' ? 'bg-[var(--color-success)]' : 'bg-gray-400'}`}
        />
      )}
    </div>
  );
}
