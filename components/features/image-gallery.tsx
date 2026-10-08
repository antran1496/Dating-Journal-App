'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { SecureImage, resolveMediaUrl } from './secure-image';

export interface GalleryMediaItem {
  id?: string;
  url?: string;
  thumbUrl?: string;
  kind?: 'image' | 'video';
  alt?: string;
}

interface ImageGalleryProps {
  items?: GalleryMediaItem[];
  urls?: string[]; // Backward compatibility
  className?: string;
}

export function ImageGallery({ items, urls, className = '' }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Normalize items from either `items` prop or `urls` prop
  const mediaList: GalleryMediaItem[] = React.useMemo(() => {
    if (items && items.length > 0) return items;
    if (urls && urls.length > 0) {
      return urls.map((url) => {
        const isVideo = /\.(mp4|mov|webm)$/i.test(url);
        return {
          url,
          kind: isVideo ? 'video' : 'image',
        };
      });
    }
    return [];
  }, [items, urls]);

  if (mediaList.length === 0) return null;

  const activeItem = selectedIndex !== null ? mediaList[selectedIndex] : null;
  const activeUrl = activeItem ? resolveMediaUrl(activeItem.id || activeItem.url, 'full') : null;

  return (
    <div className={className}>
      <div
        className={`grid gap-2 mb-4 ${
          mediaList.length === 1
            ? 'grid-cols-1'
            : mediaList.length === 2
            ? 'grid-cols-2'
            : 'grid-cols-3'
        }`}
      >
        {mediaList.map((item, idx) => {
          const isVideo = item.kind === 'video';
          const mediaRef = item.id || item.url;

          return (
            <div
              key={item.id || idx}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedIndex(idx);
                }
              }}
              className={`group relative cursor-pointer overflow-hidden rounded-[var(--radius-md)] bg-neutral-100 dark:bg-neutral-900 ${
                mediaList.length === 1 ? 'w-full max-h-80 aspect-auto' : 'aspect-square'
              }`}
              onClick={() => setSelectedIndex(idx)}
            >
              <SecureImage
                mediaId={item.id}
                src={item.thumbUrl || item.url}
                size="thumb"
                alt={item.alt || `Media ${idx + 1}`}
                containerClassName="w-full h-full"
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  mediaList.length === 1 ? 'max-h-80' : ''
                }`}
              />

              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 text-black shadow-lg">
                    <Play size={20} className="fill-black ml-0.5" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedIndex !== null && activeItem && activeUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-neutral-300 z-50 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
            onClick={() => setSelectedIndex(null)}
            aria-label="Đóng"
          >
            <X size={26} />
          </button>

          {mediaList.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-neutral-300 z-50 p-2.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(selectedIndex === 0 ? mediaList.length - 1 : selectedIndex - 1);
                }}
                aria-label="Trước"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-neutral-300 z-50 p-2.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(selectedIndex === mediaList.length - 1 ? 0 : selectedIndex + 1);
                }}
                aria-label="Sau"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <div
            className="relative flex items-center justify-center max-w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {activeItem.kind === 'video' ? (
              <video
                src={activeUrl}
                controls
                playsInline
                autoPlay
                className="max-w-full max-h-[90vh] rounded-[var(--radius-md)] object-contain shadow-2xl"
              />
            ) : (
              <img
                src={activeUrl}
                alt={activeItem.alt || 'Xem kỷ niệm'}
                className="max-w-full max-h-[90vh] object-contain rounded-[var(--radius-md)] shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
