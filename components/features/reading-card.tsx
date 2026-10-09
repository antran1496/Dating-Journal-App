'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Sparkles, Hash, Star, Calendar, Hand, ChevronDown, Share2, Lock } from 'lucide-react';
import type { AiReading } from '@/types';
import ReactMarkdown from 'react-markdown';

interface ReadingCardProps {
  reading: AiReading;
  isOwn?: boolean;
  partnerName?: string;
  onToggleShare?: (id: string, newShared: boolean) => Promise<void>;
}

const TYPE_CONFIG = {
  numerology: {
    icon: Hash,
    title: 'Thần số học',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  zodiac: {
    icon: Star,
    title: 'Cung hoàng đạo',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  tarot: {
    icon: Sparkles,
    title: 'Tarot',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  palm: {
    icon: Hand,
    title: 'Chỉ tay',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
};

export function ReadingCard({ reading, isOwn = true, partnerName, onToggleShare }: ReadingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShared, setIsShared] = useState(Boolean(reading.shared_with_partner));
  const [isUpdating, setIsUpdating] = useState(false);

  const config = TYPE_CONFIG[reading.type];

  const date = new Date(reading.created_at).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleShareToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdating || !isOwn) return;

    const nextState = !isShared;
    setIsUpdating(true);
    try {
      if (onToggleShare) {
        await onToggleShare(reading.id, nextState);
      } else {
        const res = await fetch(`/api/ai/reading/${reading.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shared_with_partner: nextState }),
        });
        if (!res.ok) throw new Error('Cập nhật thất bại');
      }
      setIsShared(nextState);
    } catch (err) {
      console.error('Failed to toggle reading share status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const sharedByText = reading.profile?.display_name || partnerName || 'Người ấy';

  return (
    <Card className="overflow-hidden border-2 border-border hover:border-primary/20 transition-colors">
      <CardHeader 
        className="bg-surface-hover border-b border-border py-3 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-text flex-wrap">
            <Calendar className={`w-4 h-4 ${config.color}`} />
            <span className="font-medium text-sm">{date}</span>
            {!isOwn && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <Share2 className="w-3 h-3" /> Được chia sẻ bởi {sharedByText}
              </span>
            )}
          </div>
          <ChevronDown className={`w-5 h-5 text-text-muted transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </CardHeader>
      
      {/* Share with partner toggle for own reading */}
      {isOwn && (
        <div 
          onClick={handleShareToggle}
          className="px-4 py-2 bg-surface border-b border-border/60 flex items-center justify-between text-xs cursor-pointer hover:bg-surface-hover/80 transition-colors select-none"
        >
          <div className="flex items-center gap-2 text-text">
            {isShared ? (
              <Share2 className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-text-muted" />
            )}
            <span>
              <strong className="font-medium">Chia sẻ kết quả cho người ấy</strong>
              <span className="text-text-muted ml-1">— Mặc định chỉ mình bạn thấy.</span>
            </span>
          </div>
          <div className="relative inline-flex items-center shrink-0 ml-3">
            <input 
              type="checkbox" 
              checked={isShared} 
              onChange={() => {}} // handled by parent div click
              disabled={isUpdating}
              className="sr-only" 
            />
            <div className={`w-8 h-4 rounded-full transition-colors ${isShared ? 'bg-primary' : 'bg-border'}`} />
            <div className={`absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isShared ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </div>
      )}

      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <CardBody className="pt-6">
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-heading prose-headings:text-primary prose-a:text-accent">
              <ReactMarkdown>{reading.result_text}</ReactMarkdown>
            </div>
          </CardBody>
        </div>
      </div>
    </Card>
  );
}
