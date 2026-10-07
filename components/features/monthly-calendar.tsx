'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { useCouple } from '@/hooks/use-couple';
import { useCalendarDates } from '@/hooks/use-dates';
import type { DateEntry } from '@/types';
import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function parseLocalDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) return startOfDay(dateInput);
  const dateStr = String(dateInput).split('T')[0];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return startOfDay(new Date(dateInput));
}

export function MonthlyCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { t } = useLocale();
  const router = useRouter();

  const { couple, isLoading: isLoadingCouple } = useCouple();
  const { data: dates, isLoading: isLoadingDates } = useCalendarDates(couple?.id);

  if (isLoadingCouple) {
    return <LoadingSkeleton variant="rect" height="400px" className="rounded-[var(--radius-lg)]" />;
  }

  const anniversaryDate = couple?.anniversary_date ? parseLocalDate(couple.anniversary_date) : null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = 'MMMM - yyyy';
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getDatesForDay = (day: Date) => {
    if (!dates) return [];
    return dates.filter((d) => {
      const entryDate = d.date_time ? new Date(d.date_time) : new Date(d.created_at);
      return isSameDay(entryDate, day);
    });
  };

  const handleDayClick = (day: Date) => {
    const dayDates = getDatesForDay(day);
    if (dayDates.length > 0) {
      router.push(`/dates/${dayDates[0].id}`);
    } else {
      const formattedDateStr = format(day, 'yyyy-MM-dd');
      router.push(`/dates/new?date=${formattedDateStr}`);
    }
  };

  return (
    <div className="bg-surface rounded-[var(--radius-lg)] border border-border shadow-sm p-2.5 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
        <h2 className="font-heading text-base sm:text-lg md:text-xl font-bold text-text capitalize truncate">
          {format(currentMonth, dateFormat, { locale: vi })}
        </h2>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 sm:p-2 rounded-[var(--radius-md)] hover:bg-surface-hover text-text-muted transition-colors cursor-pointer"
            aria-label="Tháng trước"
          >
            <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 sm:p-2 rounded-[var(--radius-md)] hover:bg-surface-hover text-text-muted transition-colors cursor-pointer"
            aria-label="Tháng sau"
          >
            <ChevronRight size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 mb-1.5 sm:mb-2">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
          <div key={day} className="text-center text-[11px] sm:text-xs font-semibold text-text-muted py-1 sm:py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const dayDates = getDatesForDay(day);
          const hasEvent = dayDates.length > 0;
          
          let dayCountText = '';
          if (anniversaryDate && (isAfter(day, anniversaryDate) || isSameDay(day, anniversaryDate))) {
            const count = differenceInCalendarDays(day, anniversaryDate) + 1;
            dayCountText = count === 0 ? '0' : `${count}`;
          }

          return (
            <div
              key={day.toString()}
              onClick={() => handleDayClick(day)}
              className={`
                relative h-[50px] sm:h-[58px] md:h-24 p-0.5 sm:p-1 md:p-2 border rounded-[var(--radius-sm)] sm:rounded-[var(--radius-md)] transition-all flex items-center justify-center overflow-hidden select-none cursor-pointer hover:border-primary/50 hover:bg-primary/10 hover:shadow-sm active:scale-95
                ${isCurrentMonth ? 'bg-surface border-border' : 'bg-surface/30 border-transparent text-text-muted/30'}
                ${isToday ? 'border-primary ring-1 ring-primary/25 bg-primary/5' : ''}
              `}
            >
              {/* Day Count from Anniversary (Top Right) */}
              {dayCountText && isCurrentMonth && (
                <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 md:top-2 md:right-2 pointer-events-none">
                  <span className="text-[9px] sm:text-[10px] md:text-xs text-text-muted font-medium bg-surface-hover/90 px-0.5 sm:px-1 py-0.5 rounded leading-none block">
                    {dayCountText}
                  </span>
                </div>
              )}

              {/* Day Number (Centered) */}
              <span className={`text-sm sm:text-base md:text-xl font-semibold leading-none ${isToday ? 'text-primary font-bold' : 'text-text'} ${!isCurrentMonth && !isToday ? 'opacity-30' : ''}`}>
                {format(day, 'd')}
              </span>

              {/* Event Indicator (Bottom Center) */}
              <div className="absolute bottom-1 sm:bottom-1.5 md:bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                {hasEvent && (
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 shadow-sm" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
