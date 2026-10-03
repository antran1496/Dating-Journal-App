'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Gift, X } from 'lucide-react';
import { useCouple } from '@/hooks/use-couple';
import { useLocale } from '@/components/providers/locale-provider';

export function MilestoneBanner() {
  const { upcomingAlerts, isLoading } = useCouple();
  const { t } = useLocale();
  const [isVisible, setIsVisible] = useState(false);
  const [closestMilestone, setClosestMilestone] = useState<typeof upcomingAlerts[number] | null>(null);
  const prevLabelRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !upcomingAlerts || upcomingAlerts.length === 0) return;

    const milestone = upcomingAlerts[0];
    // Only update if the milestone label actually changed to avoid infinite loop
    if (prevLabelRef.current === milestone.label) return;
    prevLabelRef.current = milestone.label;

    setClosestMilestone(milestone);
      
    const storageKey = `milestone_banner_dismissed_${milestone.label}_${new Date(milestone.date).toISOString().split('T')[0]}`;
    const isDismissed = localStorage.getItem(storageKey);
      
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, [isLoading, upcomingAlerts]);

  const handleDismiss = () => {
    if (closestMilestone) {
      const storageKey = `milestone_banner_dismissed_${closestMilestone.label}_${new Date(closestMilestone.date).toISOString().split('T')[0]}`;
      localStorage.setItem(storageKey, 'true');
    }
    setIsVisible(false);
  };

  if (!isVisible || !closestMilestone) return null;

  return (
    <div className="relative mb-6 p-4 rounded-[var(--radius-lg)] bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 flex items-center justify-between group shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 rounded-full bg-surface/50 flex items-center justify-center text-primary shrink-0 shadow-sm">
          <Gift className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <p className="font-semibold text-text">
            {t('milestone.upcoming', { 
              days: closestMilestone.daysUntil, 
              label: closestMilestone.label 
            })}
          </p>
        </div>
      </div>
      <button 
        onClick={handleDismiss}
        className="text-text-muted hover:text-text transition-colors p-2 rounded-full hover:bg-surface/50 shrink-0"
        aria-label={t('milestone.close')}
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
