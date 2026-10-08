import React from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Trash2, Edit3 } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from './rating-stars';
import { SecureImage } from './secure-image';
import type { DateEntry } from '@/types';

interface DateCardProps {
  date: DateEntry;
  onDelete?: (id: string) => void;
  className?: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Chưa ghi nhận';
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric',
  }).format(new Date(dateStr));
}

export function DateCard({ date, onDelete, className = '' }: DateCardProps) {
  return (
    <Card hoverable className={`group transition-all duration-200 ${className}`}>
      {(date.media?.[0]?.id || date.checkin_image_url) && (
        <div className="overflow-hidden rounded-t-[var(--radius-lg)] h-40 bg-neutral-100 dark:bg-neutral-900">
          <SecureImage
            mediaId={date.media?.[0]?.id}
            src={date.checkin_image_url}
            size="thumb"
            alt={date.title || date.location_name || 'Buổi hẹn'}
            containerClassName="w-full h-full"
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <CardBody>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-heading font-semibold text-text text-lg leading-tight line-clamp-1">
            {date.location_name ?? 'Không có địa điểm'}
          </h3>
          {date.rating && (
            <RatingStars value={date.rating} readonly size="sm" />
          )}
        </div>

        <div className="flex items-center gap-1.5 text-text-muted text-sm mb-3">
          <Calendar size={14} />
          <span>{formatDate(date.date_time ?? date.created_at)}</span>
        </div>

        {date.pros && (
          <p className="text-sm text-text line-clamp-2 mb-3">{date.pros}</p>
        )}

        <div className="flex items-center justify-between">
          <Link
            href={`/dates/${date.id}`}
            className="text-sm text-primary font-medium hover:underline"
          >
            Xem chi tiết →
          </Link>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              href={`/dates/${date.id}/edit`}
              className="p-1.5 rounded-[var(--radius-sm)] text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
            >
              <Edit3 size={15} />
            </Link>
            {onDelete && (
              <button
                onClick={() => onDelete(date.id)}
                className="p-1.5 rounded-[var(--radius-sm)] text-text-muted hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
