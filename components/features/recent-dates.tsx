'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { MapPin, ArrowRight, Star } from 'lucide-react';
import { useCouple } from '@/hooks/use-couple';
import { useRecentDates } from '@/hooks/use-dates';
import { SecureImage } from '@/components/features/secure-image';
import { DashboardEmptyDates } from '@/components/features/dashboard-empty-dates';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

const MOOD_EMOJIS: Record<string, string> = {
  love: '❤️',
  happy: '😊',
  calm: '🌿',
  excited: '🎉',
  tired: '🥱',
  sad: '🌧️',
};

export function RecentDates() {
  const router = useRouter();
  const { couple, isLoading: isLoadingCouple } = useCouple();
  const { data: dates = [], isLoading: isLoadingDates } = useRecentDates(couple?.id, 3);

  if (isLoadingCouple || isLoadingDates) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <LoadingSkeleton variant="text" width="160px" height="24px" />
          <LoadingSkeleton variant="text" width="90px" height="20px" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <LoadingSkeleton variant="rect" height="220px" className="rounded-[var(--radius-xl)]" />
          <LoadingSkeleton variant="rect" height="220px" className="rounded-[var(--radius-xl)]" />
          <LoadingSkeleton variant="rect" height="220px" className="rounded-[var(--radius-xl)]" />
        </div>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg sm:text-xl font-bold text-text">
            Kỷ niệm gần đây
          </h2>
          <Link
            href="/dates"
            className="text-xs sm:text-sm text-primary font-semibold hover:underline flex items-center gap-1"
          >
            <span>Tất cả kỷ niệm</span>
            <ArrowRight size={15} />
          </Link>
        </div>
        <DashboardEmptyDates />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg sm:text-xl font-bold text-text">
          Kỷ niệm gần đây
        </h2>
        <Link
          href="/dates"
          className="text-xs sm:text-sm text-primary font-semibold hover:underline flex items-center gap-1"
        >
          <span>Tất cả kỷ niệm</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
        {dates.map((date) => {
          const dateStr = date.date_time
            ? format(new Date(date.date_time), 'dd/MM/yyyy')
            : format(new Date(date.created_at), 'dd/MM/yyyy');

          const moodEmoji = date.mood ? MOOD_EMOJIS[date.mood] : null;
          const mediaItem = date.media && date.media.length > 0 ? date.media[0] : null;
          const place = date.places && date.places.length > 0 ? date.places[0] : null;
          const location = place?.name || date.location_name;

          return (
            <div
              key={date.id}
              onClick={() => router.push(`/dates/${date.id}`)}
              className="group bg-surface rounded-[var(--radius-xl)] border border-border hover:border-primary/40 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col"
            >
              {/* Media Thumbnail */}
              <div className="relative aspect-4/3 w-full bg-surface-hover overflow-hidden">
                <SecureImage
                  mediaId={mediaItem?.id}
                  src={mediaItem ? undefined : date.checkin_image_url}
                  alt={date.title || 'Kỷ niệm'}
                  size="thumb"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {moodEmoji && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-sm shadow-xs">
                    {moodEmoji}
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                    <span>{dateStr}</span>
                    {date.rating && (
                      <span className="flex items-center gap-0.5 text-amber-500 font-medium">
                        <Star size={12} fill="currentColor" />
                        <span>{date.rating}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-sm sm:text-base text-text line-clamp-1 group-hover:text-primary transition-colors">
                    {date.title || 'Buổi hẹn hò'}
                  </h3>

                  {location && (
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-1 truncate">
                      <MapPin size={12} className="shrink-0 text-text-muted/80" />
                      <span className="truncate">{location}</span>
                    </p>
                  )}
                </div>

                {date.note && (
                  <p className="text-xs text-text-muted/80 line-clamp-1 italic mt-1 border-t border-border/50 pt-2">
                    &ldquo;{date.note}&rdquo;
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
