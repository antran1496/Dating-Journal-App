'use client';

import { Gift, Cake, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useCouple } from '@/hooks/use-couple';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export function UpcomingMilestones() {
  const { nextMilestones, isLoading } = useCouple();

  if (isLoading) {
    return (
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 space-y-3">
        <LoadingSkeleton variant="text" width="40%" height="20px" />
        <LoadingSkeleton variant="rect" height="60px" className="rounded-[var(--radius-lg)]" />
        <LoadingSkeleton variant="rect" height="60px" className="rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  const milestonesToShow = nextMilestones.slice(0, 3);

  return (
    <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base sm:text-lg font-bold text-text flex items-center gap-2">
          <span>🎁</span> Mốc sắp tới
        </h3>
      </div>

      {milestonesToShow.length === 0 ? (
        <div className="text-center py-6 text-text-muted text-xs">
          Chưa có mốc kỷ niệm sắp tới
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {milestonesToShow.map((m, idx) => {
            const isBirthday = m.type === 'birthday';
            const isToday = m.daysUntil === 0;

            return (
              <div
                key={`${m.label}-${idx}`}
                className="flex items-center justify-between p-3 rounded-[var(--radius-lg)] bg-surface-hover/60 border border-border/80 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isBirthday
                        ? 'bg-amber-500/10 text-amber-600'
                        : isToday
                        ? 'bg-primary/10 text-primary'
                        : 'bg-accent/10 text-accent'
                    }`}
                  >
                    {isBirthday ? (
                      <Cake size={18} />
                    ) : isToday ? (
                      <Sparkles size={18} />
                    ) : (
                      <Gift size={18} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-text truncate">
                      {m.label}
                    </p>
                    <p className="text-xs text-text-muted">
                      {format(m.date, 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ml-2 ${
                    isToday
                      ? 'bg-primary text-white font-bold animate-pulse'
                      : m.daysUntil <= 7
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold'
                      : 'bg-surface text-text-muted border border-border'
                  }`}
                >
                  {isToday ? 'Hôm nay! 🎉' : `còn ${m.daysUntil} ngày`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
