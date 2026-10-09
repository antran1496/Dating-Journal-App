'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Heart, PartyPopper, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useCouple } from '@/hooks/use-couple';
import { useLocale } from '@/components/providers/locale-provider';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export function MilestoneCelebration() {
  const { todayMilestone, isLoading } = useCouple();
  const { t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && todayMilestone) {
      const storageKey = `milestone_celebrated_${todayMilestone.label}_${new Date(todayMilestone.date).toISOString().split('T')[0]}`;
      const hasCelebrated = localStorage.getItem(storageKey);
      
      if (!hasCelebrated) {
        setIsOpen(true);
      }
    }
  }, [isLoading, todayMilestone]);

  useEffect(() => {
    if (isOpen) {
      fireConfetti();
    }
  }, [isOpen]);

  const fireConfetti = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#ff6b81', '#ff4757', '#ff6348', '#ffa502', '#ff6b81'];
    
    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  const handleClose = () => {
    if (todayMilestone) {
      const storageKey = `milestone_celebrated_${todayMilestone.label}_${new Date(todayMilestone.date).toISOString().split('T')[0]}`;
      localStorage.setItem(storageKey, 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen || !todayMilestone) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="flex flex-col items-center text-center p-6 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 animate-ping opacity-20">
            <Heart className="w-20 h-20 text-primary" fill="currentColor" />
          </div>
          <Heart className="w-20 h-20 text-primary relative z-10 animate-bounce" fill="currentColor" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-heading font-bold text-primary flex items-center justify-center gap-2">
            <PartyPopper className="w-8 h-8" />
            {t('milestone.congratulations')}
            <PartyPopper className="w-8 h-8" />
          </h2>
          <p className="text-xl text-text">
            {t('milestone.todayMessage', { label: todayMilestone.label })}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center pt-2">
          <Link href="/wrapped/share?template=milestone" onClick={handleClose} className="w-full sm:w-auto">
            <Button 
              variant="secondary"
              className="w-full sm:w-auto text-base px-6 py-4 rounded-full gap-2 border border-primary/30 text-primary hover:bg-primary/10"
            >
              <Share2 className="w-4 h-4" />
              Tạo thẻ mốc
            </Button>
          </Link>
          <Button 
            onClick={handleClose} 
            className="w-full sm:w-auto text-base px-8 py-4 rounded-full"
            size="lg"
          >
            {t('milestone.celebrate')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
