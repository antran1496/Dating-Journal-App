'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, MapPin, Heart, Flame, ChevronLeft, ChevronRight, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { todayVN } from '@/lib/time';

interface WrappedSummary {
  period: string;
  partner1_name: string;
  partner2_name: string;
  total_dates: number;
  unique_locations: number;
  top_mood: string | null;
  total_photos: number;
  longest_streak: number;
  days_together: number;
  milestones_count: number;
  total_spend: number | null;
  area_labels: string[];
}

export default function WrappedPage() {
  const currentVn = todayVN();
  const currentMonth = currentVn.slice(0, 7);

  // Available periods: current and recent months, plus years
  const periods = [
    { id: currentMonth, label: `Tháng này (${currentMonth.slice(5)}/${currentMonth.slice(0, 4)})` },
    { id: '2026', label: 'Cả năm 2026' },
    { id: '2025', label: 'Năm 2025' },
  ];

  const [selectedPeriod, setSelectedPeriod] = useState(currentMonth);
  const [data, setData] = useState<WrappedSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    async function loadWrapped() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/wrapped?period=${selectedPeriod}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data.shareable);
        }
      } catch (err) {
        console.error('Failed to load wrapped:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWrapped();
  }, [selectedPeriod]);

  const slides = data ? [
    {
      title: 'Hành trình bên nhau',
      icon: Heart,
      stat: `${data.days_together} ngày`,
      sub: `${data.partner1_name} & ${data.partner2_name}`,
      detail: `Hai bạn đã cùng nhau đi qua ${data.total_dates} buổi hẹn hò đáng nhớ.`,
      bg: 'from-pink-500/20 via-rose-500/10 to-transparent',
      borderColor: 'border-pink-500/30',
    },
    {
      title: 'Dấu chân kỷ niệm',
      icon: MapPin,
      stat: `${data.unique_locations} địa điểm`,
      sub: 'Đã cùng nhau khám phá',
      detail: data.area_labels.length > 0 
        ? `Những khu vực ghé thăm nhiều nhất: ${data.area_labels.join(', ')}.`
        : 'Từng con phố và quán quen đều ghi dấu câu chuyện tình yêu.',
      bg: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderColor: 'border-amber-500/30',
    },
    {
      title: 'Khoảnh khắc & Cảm xúc',
      icon: Sparkles,
      stat: `${data.total_photos} tấm ảnh`,
      sub: 'Được lưu giữ trọn vẹn',
      detail: data.top_mood 
        ? `Tâm trạng chủ đạo của hai bạn trong giai đoạn này là ${data.top_mood.toUpperCase()} 🥰.`
        : 'Mỗi bức ảnh là một nụ cười, một ánh mắt trao nhau.',
      bg: 'from-purple-500/20 via-indigo-500/10 to-transparent',
      borderColor: 'border-purple-500/30',
    },
    {
      title: 'Sự thấu hiểu & Gắn kết',
      icon: Flame,
      stat: `${data.longest_streak} ngày chuỗi`,
      sub: 'Trả lời câu hỏi hàng ngày',
      detail: `Đã mở khoá ${data.milestones_count} cột mốc ý nghĩa trong mối quan hệ.`,
      bg: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'border-emerald-500/30',
    },
  ] : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Wrapped — Tổng kết của hai bạn
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Khám phá lại hành trình tình yêu qua những con số thú vị.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-muted" />
          <select
            value={selectedPeriod}
            onChange={(e) => {
              setSelectedPeriod(e.target.value);
              setActiveSlide(0);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface border border-border text-text focus:outline-none focus:border-primary"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-80 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-text-muted">Đang tổng hợp dữ liệu Wrapped...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Card Carousel (1 trên 4) */}
          <div className="relative">
            <Card className={`relative overflow-hidden border-2 ${slides[activeSlide]?.borderColor} bg-gradient-to-br ${slides[activeSlide]?.bg} bg-surface transition-all duration-300 min-h-[340px] flex flex-col justify-between p-6 sm:p-8 shadow-md`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface/80 border border-border text-text-muted">
                  {activeSlide + 1} trên {slides.length}
                </span>
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  {selectedPeriod.length === 7 ? `Tháng ${selectedPeriod.slice(5)}/${selectedPeriod.slice(0, 4)}` : `Năm ${selectedPeriod}`}
                </span>
              </div>

              <div className="my-6 text-center space-y-3">
                <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-1">
                  {React.createElement(slides[activeSlide]?.icon || Heart, { className: 'w-8 h-8' })}
                </div>
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
                  {slides[activeSlide]?.title}
                </h3>
                <div className="text-4xl sm:text-5xl font-heading font-extrabold text-text tracking-tight">
                  {slides[activeSlide]?.stat}
                </div>
                <div className="text-base font-medium text-primary">
                  {slides[activeSlide]?.sub}
                </div>
                <p className="text-sm text-text-muted max-w-md mx-auto pt-2">
                  {slides[activeSlide]?.detail}
                </p>
              </div>

              {/* Navigation dots */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
                  disabled={activeSlide === 0}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  {slides.map((_, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`h-2 rounded-full transition-all ${activeSlide === idx ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-text-muted/50'}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSlide((prev) => Math.min(slides.length - 1, prev + 1))}
                  disabled={activeSlide === slides.length - 1}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </Card>
          </div>

          {/* Action CTA to Share page */}
          <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-3">
            <Link href={`/wrapped/share?period=${selectedPeriod}`}>
              <Button variant="primary" className="w-full sm:w-auto px-8 gap-2 text-base h-12 shadow-glow">
                <Share2 className="w-5 h-5" />
                Tạo thẻ để khoe
              </Button>
            </Link>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              Thẻ dọc 1080×1920 cho story. Địa điểm chính xác và ghi chú riêng được ẩn.
            </p>
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <CardBody>
            <p className="text-text-muted">Chưa có đủ dữ liệu cho khoảng thời gian này.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
