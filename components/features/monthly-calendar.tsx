'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  differenceInCalendarDays,
  isAfter,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { useCouple } from '@/hooks/use-couple';
import { useDates } from '@/hooks/use-dates';
import { Modal } from '@/components/ui/modal';
import { DateCard } from '@/components/features/date-card';
import type { DateEntry } from '@/types';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export function MonthlyCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { couple, isLoading: isLoadingCouple } = useCouple();
  const { data: dates, isLoading: isLoadingDates } = useDates(couple?.id);

  if (isLoadingCouple) {
    return <LoadingSkeleton variant="rect" height="400px" className="rounded-[var(--radius-lg)]" />;
  }

  const anniversaryDate = couple?.anniversary_date ? new Date(couple.anniversary_date) : null;

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

  // Find dates for a specific day
  const getDatesForDay = (day: Date) => {
    if (!dates) return [];
    return dates.filter((d: DateEntry) => {
      const entryDate = d.date_time ? new Date(d.date_time) : new Date(d.created_at);
      return isSameDay(entryDate, day);
    });
  };

  const handleDayClick = (day: Date, dayDates: DateEntry[]) => {
    if (dayDates.length > 0) {
      setSelectedDay(day);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="bg-surface rounded-[var(--radius-lg)] border border-border shadow-sm p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-text capitalize">
          {format(currentMonth, dateFormat, { locale: vi })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-[var(--radius-md)] hover:bg-surface-hover text-text-muted transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-[var(--radius-md)] hover:bg-surface-hover text-text-muted transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 mb-2">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-text-muted py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {days.map((day, idx) => {
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
              onClick={() => handleDayClick(day, dayDates)}
              className={`
                relative aspect-square md:aspect-auto md:h-24 p-1 md:p-2 border rounded-[var(--radius-md)] transition-all flex items-center justify-center
                ${isCurrentMonth ? 'bg-surface border-border' : 'bg-surface/50 border-transparent text-text-muted/50'}
                ${isToday ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : ''}
                ${hasEvent ? 'cursor-pointer hover:border-primary/50 hover:bg-primary/10 hover:shadow-sm' : ''}
              `}
            >
              {/* Day Count from Anniversary (Top Right) */}
              {dayCountText && isCurrentMonth && (
                <div className="absolute top-1 right-1 md:top-2 md:right-2">
                  <span className="text-[10px] md:text-xs text-text-muted font-medium bg-surface-hover px-1 rounded-sm">
                    {dayCountText}
                  </span>
                </div>
              )}

              {/* Day Number (Centered) */}
              <span className={`text-lg md:text-xl font-medium ${isToday ? 'text-primary font-bold' : 'text-text'} ${!isCurrentMonth && !isToday ? 'opacity-40' : ''}`}>
                {format(day, 'd')}
              </span>

              {/* Event Indicator (Bottom Center) */}
              <div className="absolute bottom-1 md:bottom-2 left-0 right-0 flex justify-center gap-1">
                {hasEvent && (
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 shadow-sm" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Kỷ niệm ngày ${selectedDay ? format(selectedDay, 'dd/MM/yyyy') : ''}`}
        size="lg"
      >
        <div className="space-y-4">
          {selectedDay && getDatesForDay(selectedDay).map(date => (
            <DateCard key={date.id} date={date} />
          ))}
        </div>
      </Modal>
    </div>
  );
}
