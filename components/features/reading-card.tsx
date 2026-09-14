'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Hash, Star, Calendar, Hand, ChevronDown } from 'lucide-react';
import type { AiReading } from '@/types';
import ReactMarkdown from 'react-markdown';

interface ReadingCardProps {
  reading: AiReading;
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

export function ReadingCard({ reading }: ReadingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = TYPE_CONFIG[reading.type];
  const Icon = config?.icon || Sparkles;

  const date = new Date(reading.created_at).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="overflow-hidden border-2 border-border hover:border-primary/20 transition-colors">
      <CardHeader 
        className="bg-surface-hover border-b border-border py-3 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-text">
            <Calendar className={`w-4 h-4 ${config.color}`} />
            <span className="font-medium">{date}</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </CardHeader>
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
