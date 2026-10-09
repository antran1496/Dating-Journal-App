'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Share2, Download, Check, Shield, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const TEMPLATES = [
  { id: 'classic', name: 'Hồng Lãng Mạn', color: 'from-pink-500 to-rose-400' },
  { id: 'modern', name: 'Đêm Huyền Bí', color: 'from-indigo-900 to-indigo-600' },
  { id: 'sunset', name: 'Hoàng Hôn Ấm', color: 'from-orange-500 to-rose-600' },
  { id: 'minimal', name: 'Tối Giản Slate', color: 'from-slate-100 to-slate-300' },
  { id: 'retro', name: 'Vintage Ngọt', color: 'from-yellow-200 to-pink-400' },
  { id: 'milestone', name: 'Cột Mốc Vàng', color: 'from-amber-400 to-amber-700' },
];

function WrappedShareContent() {
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || '2026';
  const initialTemplate = searchParams.get('template') || 'classic';

  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate);
  const [hideExactLocation] = useState(true); // Always true & disabled per spec
  const [hideNotes, setHideNotes] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const cardImageUrl = `/api/wrapped/card?period=${encodeURIComponent(period)}&template=${selectedTemplate}&watermark=${showWatermark}&hideNotes=${hideNotes}`;

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const response = await fetch(cardImageUrl);
      const blob = await response.blob();
      const file = new File([blob], `dating-journal-wrapped-${period}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Dating Journal Wrapped',
          text: 'Tổng kết hành trình tình yêu của tụi mình 💕',
        });
      } else {
        // Fallback: download PNG file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dating-journal-wrapped-${period}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      console.error('Sharing failed:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/wrapped" className="p-2 -ml-2 text-text-muted hover:text-text rounded-full hover:bg-surface-hover">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text">
            Thẻ chia sẻ — Xem trước trước khi đăng ra ngoài
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5">
            Thẻ dọc 1080×1920 tối ưu cho Story Instagram, Facebook và Zalo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Card Preview (Aspect 9:16) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-[320px] rounded-[28px] overflow-hidden shadow-2xl border-4 border-border/80 bg-surface relative aspect-[9/16]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardImageUrl}
              alt="Dating Journal Wrapped Card Preview"
              className="w-full h-full object-cover select-none"
            />
          </div>
        </div>

        {/* Right: Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Mẫu thẻ */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-text flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Chọn mẫu thẻ (Miễn phí)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                    selectedTemplate === tpl.id
                      ? 'border-primary ring-2 ring-primary/20 bg-surface shadow-sm'
                      : 'border-border bg-surface hover:border-border-hover'
                  }`}
                >
                  <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${tpl.color} shadow-inner`} />
                  <span className="text-xs font-medium text-text truncate">{tpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Tuỳ chọn quyền riêng tư */}
          <Card className="p-4 space-y-4 border border-border bg-surface">
            <h3 className="text-xs font-semibold text-text uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary" />
              Bảo vệ quyền riêng tư
            </h3>

            {/* Toggle 1: Ẩn địa điểm chính xác (Luôn bật, disabled) */}
            <div className="flex items-start justify-between gap-3 opacity-90">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-text block">Ẩn địa điểm chính xác</span>
                <span className="text-xs text-text-muted block">
                  Luôn bật cho thẻ chia sẻ ra ngoài. Chỉ hiển thị tên quận/thành phố chung chung.
                </span>
              </div>
              <input
                type="checkbox"
                checked={hideExactLocation}
                disabled
                className="mt-1 h-4 w-4 rounded accent-primary cursor-not-allowed"
              />
            </div>

            {/* Toggle 2: Ẩn ghi chú riêng */}
            <div className="flex items-start justify-between gap-3 pt-3 border-t border-border">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-text block">Ẩn ghi chú riêng</span>
                <span className="text-xs text-text-muted block">
                  Giữ kín những tâm sự và ghi chú cá nhân của hai bạn.
                </span>
              </div>
              <input
                type="checkbox"
                checked={hideNotes}
                onChange={(e) => setHideNotes(e.target.checked)}
                className="mt-1 h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </div>

            {/* Toggle 3: Watermark và mã QR */}
            <div className="flex items-start justify-between gap-3 pt-3 border-t border-border">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-text block">Watermark và mã QR</span>
                <span className="text-xs text-text-muted block">
                  Hiện dòng &apos;Tạo bằng Dating Journal&apos; và mã QR. Tự do bật hoặc tắt.
                </span>
              </div>
              <input
                type="checkbox"
                checked={showWatermark}
                onChange={(e) => setShowWatermark(e.target.checked)}
                className="mt-1 h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </div>
          </Card>

          {/* 3. Nút Chia sẻ */}
          <div className="space-y-3 pt-2">
            <Button
              variant="primary"
              onClick={handleShare}
              disabled={isSharing}
              className="w-full h-12 text-base gap-2 shadow-glow"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang chuẩn bị ảnh...
                </>
              ) : copied ? (
                <>
                  <Check className="w-5 h-5" /> Đã tải ảnh xuống thành công!
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" /> Chia sẻ hoặc Tải về
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
              <Download className="w-3.5 h-3.5" />
              <span>Nếu thiết bị không hỗ trợ chia sẻ trực tiếp, ảnh PNG sẽ tự động tải về.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WrappedSharePage() {
  return (
    <Suspense
      fallback={
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <WrappedShareContent />
    </Suspense>
  );
}
