'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bell,
  ArrowLeft,
  Moon,
  Heart,
  Calendar,
  HelpCircle,
  Clock,
  Sparkles,
  Smartphone,
  Check,
} from 'lucide-react';
import { usePush } from '@/hooks/use-push';
import { useToast } from '@/components/ui/toast';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function NotificationsSettingsPage() {
  const {
    isSupported,
    isSubscribed,
    permission,
    isPending,
    prefs,
    isLoadingPrefs,
    updatePrefs,
    subscribe,
    unsubscribe,
  } = usePush();
  const { toast } = useToast();

  const handleToggleDevicePush = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast({ type: 'info', title: 'Đã tắt thông báo trên thiết bị này' });
    } else {
      const ok = await subscribe();
      if (ok) {
        toast({ type: 'success', title: 'Đã bật thông báo thành công' });
      } else {
        toast({
          type: 'error',
          title: 'Không thể bật thông báo',
          message: 'Vui lòng cho phép quyền thông báo trong cài đặt trình duyệt.',
        });
      }
    }
  };

  const handleTogglePref = (key: keyof NonNullable<typeof prefs>, currentVal: boolean) => {
    updatePrefs({ [key]: !currentVal });
  };

  const handleTimeChange = (key: 'quiet_start' | 'quiet_end', val: string) => {
    updatePrefs({ [key]: val });
  };

  if (isLoadingPrefs) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <LoadingSkeleton variant="rect" height="30px" width="180px" className="rounded-lg" />
        <LoadingSkeleton variant="rect" height="120px" className="rounded-xl" />
        <LoadingSkeleton variant="rect" height="240px" className="rounded-xl" />
      </div>
    );
  }

  const p = prefs || {
    reactions: true,
    weekend_reminder: true,
    daily_question: true,
    milestones: true,
    on_this_day: true,
    quiet_enabled: false,
    quiet_start: '22:00',
    quiet_end: '07:00',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Back to settings */}
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text font-medium transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Cài đặt</span>
        </Link>
      </div>

      <header>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text flex items-center gap-2">
          <span>🔔</span> Thông báo
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Tuỳ chỉnh thông báo đẩy để không bỏ lỡ những khoảnh khắc quan trọng.
        </p>
      </header>

      {/* 1. Device Push Notification Toggle */}
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-text">
                Bật thông báo trên thiết bị này
              </h3>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                Thêm Dating Journal vào màn hình chính để nhận thông báo đẩy tức thì.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={!isSupported || isPending}
            onClick={handleToggleDevicePush}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-40 shrink-0 ${
              isSubscribed ? 'bg-primary' : 'bg-surface-hover border border-border'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs absolute top-0.5 ${
                isSubscribed ? 'left-5.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {permission === 'denied' && (
          <p className="text-xs text-amber-600 dark:text-amber-400 pt-2 border-t border-border">
            ⚠️ Quyền thông báo đã bị chặn trên trình duyệt. Vui lòng mở Cài đặt trang web để cấp lại quyền.
          </p>
        )}
      </div>

      {/* 2. Notification Types */}
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-heading text-base font-bold text-text">
          Loại thông báo nhận
        </h3>

        <div className="space-y-3.5 divide-y divide-border/60">
          {/* Reactions & Comments */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5">
              <Heart size={16} className="text-rose-500" />
              <div>
                <span className="text-xs sm:text-sm font-semibold text-text block">
                  Người ấy thả tim hoặc bình luận
                </span>
                <span className="text-[11px] text-text-muted">
                  Nhận thông báo khi đối phương tương tác với kỷ niệm
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={p.reactions}
              onChange={() => handleTogglePref('reactions', p.reactions)}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Weekend Reminder */}
          <div className="flex items-center justify-between gap-3 pt-3.5">
            <div className="flex items-center gap-2.5">
              <Calendar size={16} className="text-primary" />
              <div>
                <span className="text-xs sm:text-sm font-semibold text-text block">
                  Nhắc ghi buổi hẹn cuối tuần
                </span>
                <span className="text-[11px] text-text-muted">
                  Gợi ý lưu lại khoảnh khắc vào tối Chủ nhật (20:00)
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={p.weekend_reminder}
              onChange={() => handleTogglePref('weekend_reminder', p.weekend_reminder)}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Daily Question */}
          <div className="flex items-center justify-between gap-3 pt-3.5">
            <div className="flex items-center gap-2.5">
              <HelpCircle size={16} className="text-indigo-500" />
              <div>
                <span className="text-xs sm:text-sm font-semibold text-text block">
                  Câu hỏi hằng ngày
                </span>
                <span className="text-[11px] text-text-muted">
                  Nhắc nhở cùng trả lời câu hỏi mỗi tối (21:00)
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={p.daily_question}
              onChange={() => handleTogglePref('daily_question', p.daily_question)}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Milestones & Birthdays */}
          <div className="flex items-center justify-between gap-3 pt-3.5">
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-amber-500" />
              <div>
                <span className="text-xs sm:text-sm font-semibold text-text block">
                  Mốc ngày yêu và sinh nhật
                </span>
                <span className="text-[11px] text-text-muted">
                  Nhắc trước 7 ngày để chuẩn bị và đúng ngày đặc biệt
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={p.milestones}
              onChange={() => handleTogglePref('milestones', p.milestones)}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>

          {/* On this day */}
          <div className="flex items-center justify-between gap-3 pt-3.5">
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="text-blue-500" />
              <div>
                <span className="text-xs sm:text-sm font-semibold text-text block">
                  Ngày này năm ngoái
                </span>
                <span className="text-[11px] text-text-muted">
                  Xem lại kỷ niệm đẹp của những năm trước vào 08:00 sáng
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={p.on_this_day}
              onChange={() => handleTogglePref('on_this_day', p.on_this_day)}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. Quiet Hours */}
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <Moon size={20} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-text">Giờ yên lặng</h3>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                Tạm dừng mọi thông báo để hai bạn nghỉ ngơi và có không gian riêng.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleTogglePref('quiet_enabled', p.quiet_enabled)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              p.quiet_enabled ? 'bg-primary' : 'bg-surface-hover border border-border'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs absolute top-0.5 ${
                p.quiet_enabled ? 'left-5.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {p.quiet_enabled && (
          <div className="pt-3 border-t border-border flex items-center gap-3 text-xs">
            <span className="text-text-muted">Từ:</span>
            <input
              type="time"
              value={p.quiet_start || '22:00'}
              onChange={(e) => handleTimeChange('quiet_start', e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-border bg-background text-text text-xs"
            />
            <span className="text-text-muted">đến:</span>
            <input
              type="time"
              value={p.quiet_end || '07:00'}
              onChange={(e) => handleTimeChange('quiet_end', e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-border bg-background text-text text-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
}
