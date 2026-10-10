'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isSameWeek,
  isAfter,
  differenceInCalendarDays,
  startOfDay,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Calendar as CalendarIcon,
  ExternalLink,
  Sparkles,
  Heart,
} from 'lucide-react';
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

const WEEKDAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function MonthlyCalendar() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const router = useRouter();

  const { couple, isLoading: isLoadingCouple } = useCouple();

  const anniversaryDate = couple?.anniversary_date
    ? parseLocalDate(couple.anniversary_date)
    : null;

  // Compute month range for data fetching so navigating weeks within month is instant
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const fetchStartDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const fetchEndDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const fetchStartStr = format(fetchStartDate, 'yyyy-MM-dd');
  const fetchEndStr = format(fetchEndDate, 'yyyy-MM-dd');

  const { data: dates = [], isLoading: isLoadingDates } = useDatesByDayRange(
    couple?.id,
    fetchStartStr,
    fetchEndStr
  );

  // Week calculation
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStartStr, weekEndStr]
  );

  // Month calculation
  const monthDays = useMemo(
    () => eachDayOfInterval({ start: fetchStartDate, end: fetchEndDate }),
    [fetchStartStr, fetchEndStr]
  );

  const today = startOfDay(new Date());

  // Week of love counter helper
  const getWeekOfLove = (date: Date): number | null => {
    if (!anniversaryDate) return null;
    if (isAfter(startOfDay(anniversaryDate), startOfDay(date))) return null;
    const daysDiff = differenceInCalendarDays(startOfDay(date), startOfDay(anniversaryDate));
    return Math.floor(daysDiff / 7) + 1;
  };

  const currentWeekOfLove = getWeekOfLove(weekStart);

  const getDatesForDay = (day: Date): DateEntry[] => {
    if (!dates || dates.length === 0) return [];
    const t = startOfDay(day).getTime();
    return dates.filter((d) => {
      const s = startOfDay(new Date(d.date_time || d.created_at)).getTime();
      const e = startOfDay(new Date(d.end_date || d.date_time || d.created_at)).getTime();
      return t >= s && t <= e;
    });
  };

  // Dates occurring in the current week
  const weekMemories = useMemo(() => {
    if (!dates || dates.length === 0) return [];
    const wStart = startOfDay(weekStart).getTime();
    const wEnd = startOfDay(weekEnd).getTime();
    return dates.filter((d) => {
      const s = startOfDay(new Date(d.date_time || d.created_at)).getTime();
      const e = startOfDay(new Date(d.end_date || d.date_time || d.created_at)).getTime();
      return (s >= wStart && s <= wEnd) || (e >= wStart && e <= wEnd) || (s <= wStart && e >= wEnd);
    });
  }, [dates, weekStartStr, weekEndStr]);

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

  const handlePrev = () => {
    if (viewMode === 'week') {
      setCurrentDate((prev) => subWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => subMonths(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  if (isLoadingCouple) {
    return <LoadingSkeleton variant="rect" height="380px" className="rounded-[var(--radius-xl)]" />;
  }

  const selectedDayDates = selectedDay ? getDatesForDay(selectedDay) : [];

  return (
    <div className="bg-surface rounded-[var(--radius-xl)] border border-border shadow-xs p-3.5 sm:p-5 md:p-6 flex flex-col gap-3.5 sm:gap-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-text">Lịch tình yêu</h2>
            {currentWeekOfLove && (
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Heart size={11} className="fill-primary" />
                Tuần {currentWeekOfLove}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            {viewMode === 'week' ? (
              <>
                {format(weekStart, 'd/M', { locale: vi })} – {format(weekEnd, 'd/M/yyyy', { locale: vi })}
              </>
            ) : (
              <span className="capitalize">{format(currentDate, 'MMMM - yyyy', { locale: vi })}</span>
            )}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* View Switcher: Tuần / Tháng */}
          <div className="flex items-center p-0.5 rounded-full bg-surface-hover border border-border text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-primary text-primary-fg font-semibold shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Tuần
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-primary text-primary-fg font-semibold shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Tháng
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToday}
              className="text-xs px-2.5 py-1 rounded-[var(--radius-md)] hover:bg-surface-hover text-text-muted hover:text-text border border-border transition-colors cursor-pointer"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 sm:p-2 rounded-[var(--radius-md)] hover:bg-surface-hover text-text-muted hover:text-text transition-colors cursor-pointer"
              aria-label={viewMode === 'week' ? 'Tuần trước' : 'Tháng trước'}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 sm:p-2 rounded-[var(--radius-md)] hover:bg-surface-hover text-text-muted hover:text-text transition-colors cursor-pointer"
              aria-label={viewMode === 'week' ? 'Tuần sau' : 'Tháng sau'}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Week View Mode */}
      {viewMode === 'week' ? (
        <div className="space-y-3.5">
          {/* Weekday Grid - 7 days strip */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            {weekDays.map((day, idx) => {
              const isDayToday = isSameDay(day, today);
              const isFuture = isAfter(startOfDay(day), today);
              const dayDates = getDatesForDay(day);
              const hasEvent = dayDates.length > 0;
              const isClickable = hasEvent || !isFuture;

              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  disabled={!isClickable}
                  onClick={() => handleDayClick(day)}
                  className={`
                    relative min-h-[72px] sm:min-h-[84px] p-1.5 sm:p-2 rounded-[var(--radius-lg)] border text-center flex flex-col items-center justify-between transition-all select-none
                    ${
                      isDayToday
                        ? 'border-primary ring-2 ring-primary/25 bg-primary/10 font-bold'
                        : 'border-border bg-surface hover:border-primary/40'
                    }
                    ${
                      hasEvent
                        ? 'cursor-pointer hover:bg-primary/5 hover:shadow-xs'
                        : isFuture
                        ? 'cursor-not-allowed opacity-40'
                        : 'cursor-pointer hover:bg-surface-hover'
                    }
                  `}
                >
                  {/* Weekday name */}
                  <span
                    className={`text-[10px] sm:text-xs font-semibold ${
                      isDayToday ? 'text-primary' : 'text-text-muted'
                    }`}
                  >
                    {WEEKDAY_NAMES[idx]}
                  </span>

                  {/* Day of month */}
                  <span
                    className={`text-base sm:text-lg font-bold leading-none my-0.5 ${
                      isDayToday ? 'text-primary' : 'text-text'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {/* Memory dot / indicator */}
                  <div className="h-4 flex items-center justify-center">
                    {hasEvent ? (
                      <span
                        className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-primary shadow-xs ring-2 ring-surface animate-in fade-in"
                        title={`${dayDates.length} kỷ niệm`}
                      />
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-transparent" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Week Memories Strip */}
          <div className="pt-2 border-t border-border/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                <Sparkles size={13} className="text-primary" />
                <span>Kỷ niệm trong tuần này</span>
                {weekMemories.length > 0 && (
                  <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                    {weekMemories.length}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => {
                  const dayStr = format(today, 'yyyy-MM-dd');
                  router.push(`/dates/new?date=${dayStr}`);
                }}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>Ghi kỷ niệm</span>
              </button>
            </div>

            {weekMemories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {weekMemories.map((d) => {
                  const rawMedia =
                    (d.media && d.media.length > 0 ? d.media[0] : null) ??
                    (d as unknown as { date_media?: { id: string; path?: string }[] }).date_media?.[0];
                  const thumbnail = rawMedia?.path ?? d.checkin_image_urls?.[0] ?? d.checkin_image_url;
                  const moodEmoji = d.mood ? MOOD_EMOJIS[d.mood] : null;
                  const dateStr = d.date_time
                    ? format(new Date(d.date_time), 'EEEE, dd/MM', { locale: vi })
                    : format(new Date(d.created_at), 'dd/MM', { locale: vi });

                  return (
                    <div
                      key={d.id}
                      onClick={() => router.push(`/dates/${d.id}`)}
                      className="group flex items-center gap-2.5 p-2 rounded-[var(--radius-md)] bg-surface border border-border hover:border-primary/40 hover:bg-surface-hover/60 transition-all cursor-pointer"
                    >
                      {/* Thumbnail */}
                      <div className="w-11 h-11 rounded-[var(--radius-md)] overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-900 border border-border/50">
                        <SecureImage
                          mediaId={rawMedia?.id}
                          src={thumbnail}
                          alt={d.title || 'Kỷ niệm'}
                          size="thumb"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          {moodEmoji && <span className="text-xs">{moodEmoji}</span>}
                          <h4 className="text-xs font-semibold text-text truncate group-hover:text-primary transition-colors">
                            {d.title || d.location_name || 'Buổi hẹn hò'}
                          </h4>
                        </div>
                        <p className="text-[11px] text-text-muted capitalize truncate mt-0.5">
                          {dateStr}
                        </p>
                      </div>

                      <ExternalLink size={13} className="text-text-muted group-hover:text-primary shrink-0 transition-colors mr-1" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-3 px-3 rounded-[var(--radius-md)] bg-surface-hover/30 border border-dashed border-border text-center">
                <p className="text-xs text-text-muted">
                  Tuần này hai bạn chưa ghi lại kỷ niệm nào 💌
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Month View Mode (Optimized without day counter overflow) */
        <div className="space-y-2">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-semibold text-text-muted">
            {WEEKDAY_NAMES.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Month Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {monthDays.map((day) => {
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isDayToday = isSameDay(day, today);
              const isFuture = isAfter(startOfDay(day), today);
              const dayDates = getDatesForDay(day);
              const hasEvent = dayDates.length > 0;
              const isClickable = hasEvent || !isFuture;

              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  disabled={!isClickable}
                  onClick={() => handleDayClick(day)}
                  className={`
                    relative h-12 sm:h-16 md:h-18 p-1 sm:p-1.5 rounded-[var(--radius-md)] border text-left flex flex-col justify-between transition-all select-none
                    ${
                      isDayToday
                        ? 'border-primary ring-2 ring-primary/25 bg-primary/10 font-bold'
                        : isCurrentMonth
                        ? 'border-border bg-surface hover:border-primary/40'
                        : 'border-transparent bg-surface/30 text-text-muted/40'
                    }
                    ${
                      hasEvent
                        ? 'cursor-pointer hover:bg-primary/5 hover:shadow-xs'
                        : isFuture
                        ? 'cursor-not-allowed opacity-35'
                        : 'cursor-pointer hover:bg-surface-hover'
                    }
                  `}
                >
                  {/* Day of month */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs sm:text-sm font-semibold leading-none ${
                        isDayToday ? 'text-primary' : 'text-text'
                      } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Bottom center: Pink dot for memories */}
                  <div className="flex items-center justify-center w-full min-h-[8px]">
                    {hasEvent && (
                      <span
                        className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary shadow-xs ring-2 ring-surface animate-in fade-in"
                        title={`${dayDates.length} kỷ niệm`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Caption */}
      <p className="text-xs text-text-muted text-center sm:text-left">
        Đếm theo tuần yêu nhau. Chấm hồng đánh dấu ngày có kỷ niệm đẹp. Chạm vào ngày để xem hoặc ghi mới.
      </p>

      {/* Day Details Modal */}
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
                const rawMedia =
                  (d.media && d.media.length > 0 ? d.media[0] : null) ??
                  (d as unknown as { date_media?: { id: string; path?: string }[] }).date_media?.[0];
                const thumbnail = rawMedia?.path ?? d.checkin_image_urls?.[0] ?? d.checkin_image_url;
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
                        mediaId={rawMedia?.id}
                        src={thumbnail}
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
