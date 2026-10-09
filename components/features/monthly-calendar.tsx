'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isAfter,
  differenceInCalendarDays,
  startOfDay,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, MapPin, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { useCouple, parseLocalDate } from '@/hooks/use-couple';
import { useDatesByDayRange } from '@/hooks/use-dates';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { SecureImage } from '@/components/features/secure-image';
import type { DateEntry } from '@/types';

const MOOD_EMOJIS: Record<string, string> = {
  love: '❤️',
  happy: '😊',
  calm: '🌿',
  excited: '🎉',
  tired: '🥱',
  sad: '🌧️',
};

export function MonthlyCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const router = useRouter();

  const { couple, isLoading: isLoadingCouple } = useCouple();

  const anniversaryDate = couple?.anniversary_date
    ? parseLocalDate(couple.anniversary_date)
    : null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');

  const { data: dates = [], isLoading: isLoadingDates } = useDatesByDayRange(
    couple?.id,
    startDateStr,
    endDateStr
  );

  const days = useMemo(
    () => eachDayOfInterval({ start: startDate, end: endDate }),
    [startDateStr, endDateStr]
  );

  const today = startOfDay(new Date());

  const getDatesForDay = (day: Date): DateEntry[] => {
    if (!dates || dates.length === 0) return [];
    const t = startOfDay(day).getTime();
    return dates.filter((d) => {
      const s = startOfDay(new Date(d.date_time || d.created_at)).getTime();
      const e = startOfDay(new Date(d.end_date || d.date_time || d.created_at)).getTime();
      return t >= s && t <= e;
    });
  };

  const handleDayClick = (day: Date) => {
    const dayDates = getDatesForDay(day);
    if (dayDates.length > 0) {
      setSelectedDay(day);
      return;
    }
    // Future empty days are not clickable per spec
    if (isAfter(startOfDay(day), today)) {
      return;
    }
    const formatted = format(day, 'yyyy-MM-dd');
    router.push(`/dates/new?date=${formatted}`);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  if (isLoadingCouple) {
    return <LoadingSkeleton variant="rect" height="420px" className="rounded-[var(--radius-xl)]" />;
  }

  const selectedDayDates = selectedDay ? getDatesForDay(selectedDay) : [];

  return (
    <div className="bg-surface rounded-[var(--radius-xl)] border border-border shadow-xs p-4 sm:p-6 flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="font-heading text-lg sm:text-xl font-bold text-text">Lịch tình yêu</h2>
          <p className="text-xs sm:text-sm text-text-muted capitalize">
            {format(currentMonth, 'MMMM - yyyy', { locale: vi })}
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-[var(--radius-md)] hover:bg-surface-hover text-text-muted hover:text-text transition-colors cursor-pointer"
            aria-label="Tháng trước"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-[var(--radius-md)] hover:bg-surface-hover text-text-muted hover:text-text transition-colors cursor-pointer"
            aria-label="Tháng sau"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-semibold text-text-muted">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isDayToday = isSameDay(day, today);
          const isFuture = isAfter(startOfDay(day), today);
          const dayDates = getDatesForDay(day);
          const hasEvent = dayDates.length > 0;

          let dayCountText = '';
          if (
            anniversaryDate &&
            (isAfter(day, anniversaryDate) || isSameDay(day, anniversaryDate))
          ) {
            const count = differenceInCalendarDays(day, anniversaryDate) + 1;
            dayCountText = count === 0 ? '0' : `${count}`;
          }

          const isClickable = hasEvent || !isFuture;

          return (
            <button
              type="button"
              key={day.toISOString()}
              disabled={!isClickable}
              onClick={() => handleDayClick(day)}
              className={`
                relative h-14 sm:h-18 md:h-20 p-1 rounded-[var(--radius-md)] border text-left flex flex-col justify-between transition-all select-none
                ${
                  isDayToday
                    ? 'border-primary ring-2 ring-primary/25 bg-primary/5 font-bold'
                    : isCurrentMonth
                    ? 'border-border bg-surface hover:border-primary/40'
                    : 'border-transparent bg-surface/30 text-text-muted/40'
                }
                ${
                  hasEvent
                    ? 'cursor-pointer hover:bg-primary/10 hover:shadow-xs'
                    : isFuture
                    ? 'cursor-not-allowed opacity-45'
                    : 'cursor-pointer hover:bg-surface-hover'
                }
              `}
            >
              {/* Top row: Day of month + Day count */}
              <div className="flex items-start justify-between w-full">
                <span
                  className={`text-xs sm:text-sm font-semibold leading-none ${
                    isDayToday ? 'text-primary' : 'text-text'
                  } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  {format(day, 'd')}
                </span>

                {/* Day count from anniversary */}
                {dayCountText && isCurrentMonth && (
                  <span className="text-[9px] sm:text-[10px] text-text-muted font-mono leading-none bg-surface-hover px-1 py-0.5 rounded-sm">
                    {dayCountText}
                  </span>
                )}
              </div>

              {/* Bottom center: Pink dot for memories */}
              <div className="flex items-center justify-center w-full min-h-[8px]">
                {hasEvent && (
                  <span
                    className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary shadow-xs ring-2 ring-surface animate-in fade-in zoom-in"
                    title={`${dayDates.length} kỷ niệm`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Caption per spec */}
      <p className="text-xs text-text-muted mt-4 text-center sm:text-left">
        Số nhỏ là ngày yêu. Chấm hồng là ngày đã ghi. Chạm vào ô trống để ghi mới.
      </p>

      {/* Day Details Bottom Sheet / Modal */}
      {selectedDay && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDay(null)}
          title={`Kỷ niệm ngày ${format(selectedDay, 'dd/MM/yyyy')}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="space-y-3">
              {selectedDayDates.map((d) => {
                const moodEmoji = d.mood ? MOOD_EMOJIS[d.mood] : null;
                const mediaItem = d.media && d.media.length > 0 ? d.media[0] : null;
                const place = d.places && d.places.length > 0 ? d.places[0] : null;

                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      setSelectedDay(null);
                      router.push(`/dates/${d.id}`);
                    }}
                    className="group flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border border-border bg-surface-hover/50 hover:bg-surface-hover hover:border-primary/40 transition-all cursor-pointer shadow-2xs"
                  >
                    {/* Media thumbnail */}
                    <div className="w-16 h-16 rounded-[var(--radius-md)] overflow-hidden shrink-0 bg-surface border border-border">
                      <SecureImage
                        mediaId={mediaItem?.id}
                        src={mediaItem ? undefined : d.checkin_image_url}
                        alt={d.title || 'Kỷ niệm'}
                        size="thumb"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {moodEmoji && <span>{moodEmoji}</span>}
                        <h4 className="font-semibold text-sm sm:text-base text-text truncate group-hover:text-primary transition-colors">
                          {d.title || 'Buổi hẹn hò'}
                        </h4>
                      </div>

                      {(place?.name || d.location_name) && (
                        <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5 truncate">
                          <MapPin size={12} className="shrink-0" />
                          <span>{place?.name || d.location_name}</span>
                        </p>
                      )}

                      {d.note && (
                        <p className="text-xs text-text-muted mt-1 line-clamp-1 italic">
                          &ldquo;{d.note}&rdquo;
                        </p>
                      )}
                    </div>

                    <ExternalLink size={16} className="text-text-muted group-hover:text-primary shrink-0 transition-colors" />
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDay(null)}
              >
                Đóng
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  const dayStr = format(selectedDay, 'yyyy-MM-dd');
                  setSelectedDay(null);
                  router.push(`/dates/new?date=${dayStr}`);
                }}
              >
                <Plus size={16} className="mr-1" />
                Ghi thêm kỷ niệm
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
