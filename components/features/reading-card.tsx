import React from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Hash, Star, Calendar } from 'lucide-react';
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
};

export function ReadingCard({ reading }: ReadingCardProps) {
  const config = TYPE_CONFIG[reading.type];
  const Icon = config?.icon || Sparkles;

  const date = new Date(reading.created_at).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className="overflow-hidden border-2 border-border hover:border-primary/20 transition-colors">
      <CardHeader className="bg-surface-hover border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bg}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{date}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-6">
        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-heading prose-headings:text-primary prose-a:text-accent">
          <ReactMarkdown>{reading.result_text}</ReactMarkdown>
        </div>
      </CardBody>
    </Card>
  );
}
