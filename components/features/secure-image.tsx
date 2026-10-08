'use client';

import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

export interface SecureImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  mediaId?: string | null;
  src?: string | null;
  size?: 'thumb' | 'full';
  fallbackText?: string;
  containerClassName?: string;
}

export function resolveMediaUrl(
  mediaIdOrSrc?: string | null,
  size: 'thumb' | 'full' = 'thumb'
): string | null {
  if (!mediaIdOrSrc) return null;

  // 1. Full URL or data/blob URI
  if (
    mediaIdOrSrc.startsWith('http://') ||
    mediaIdOrSrc.startsWith('https://') ||
    mediaIdOrSrc.startsWith('data:') ||
    mediaIdOrSrc.startsWith('blob:')
  ) {
    return mediaIdOrSrc;
  }

  // 2. Already an API media URL
  if (mediaIdOrSrc.startsWith('/api/media/')) {
    if (size === 'thumb' && !mediaIdOrSrc.includes('size=')) {
      return `${mediaIdOrSrc}${mediaIdOrSrc.includes('?') ? '&' : '?'}size=thumb`;
    }
    return mediaIdOrSrc;
  }

  // 3. UUID mediaId
  const uuidMatch = mediaIdOrSrc.match(/^[0-9a-f-]{36}$/i);
  if (uuidMatch) {
    return `/api/media/${mediaIdOrSrc}${size === 'thumb' ? '?size=thumb' : ''}`;
  }

  // Fallback to direct string
  return mediaIdOrSrc;
}

export function SecureImage({
  mediaId,
  src,
  size = 'thumb',
  alt = 'Kỷ niệm',
  className = '',
  containerClassName = '',
  fallbackText,
  loading = 'lazy',
  ...rest
}: SecureImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const effectiveSrc = resolveMediaUrl(mediaId || src, size);

  if (!effectiveSrc || error) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[var(--color-surface)] text-[var(--color-text-muted)] p-4 text-center rounded-[var(--radius-md)] border border-border/40 ${containerClassName || className}`}
      >
        <ImageIcon size={28} className="opacity-40 mb-1" />
        <span className="text-xs opacity-70">{fallbackText || 'Không thể tải ảnh'}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-[inherit]"
        />
      )}
      <img
        src={effectiveSrc}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        {...rest}
      />
    </div>
  );
}
