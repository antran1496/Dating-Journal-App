'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Copy,
  Check,
  Share2,
  RefreshCw,
  Trash2,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface ActiveInviteData {
  id: string;
  expires_at: string;
  created_at: string;
  message: string | null;
  code_hint: string;
  token?: string;
  code?: string;
  formattedToken?: string;
}

export default function CoupleInvitePage() {
  const router = useRouter();

  const [inviteData, setInviteData] = useState<ActiveInviteData | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<string>('47:59:59');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lấy hoặc tạo invite active
  const fetchOrCreateInvite = useCallback(async () => {
    try {
      // 1. Kiểm tra active invite hiện tại
      const res = await fetch('/api/invites/active');
      const data = await res.json().catch(() => ({}));

      if (data.member_count >= 2) {
        // Đã có 2 người → vào thẳng dashboard
        router.push('/dashboard');
        return;
      }

      if (data.invite) {
        setInviteData(data.invite);
        const origin = window.location.origin;
        // Nếu vừa tạo ở session này thì có thể có token, nếu không thì hiển thị placeholder token hint
        const displayToken = data.invite.formattedToken || 'k3x9-ma7q-p2';
        setInviteUrl(`${origin}/join/${displayToken}`);
      } else {
        // Chưa có active invite → tự động tạo invite mới
        const createRes = await fetch('/api/invites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Mình tạo chỗ này cho hai đứa. Vào đi người yêu 💗' }),
        });
        const createData = await createRes.json().catch(() => ({}));
        if (createData.ok && createData.invite) {
          setInviteData(createData.invite);
          const origin = window.location.origin;
          setInviteUrl(`${origin}/join/${createData.invite.token}`);
        }
      }
    } catch {
      setError('Không thể tải thông tin lời mời.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOrCreateInvite();
  }, [fetchOrCreateInvite]);

  // Polling mỗi 3 giây để kiểm tra xem người kia đã vào couple chưa
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/invites/active');
        const data = await res.json().catch(() => ({}));
        if (data.member_count >= 2) {
          clearInterval(pollInterval);
          router.push('/dashboard');
        }
      } catch {
        // Ignore polling error
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [router]);

  // Countdown timer
  useEffect(() => {
    if (!inviteData?.expires_at) return;

    const timer = setInterval(() => {
      const diff = new Date(inviteData.expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Đã hết hạn');
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [inviteData?.expires_at]);

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (!inviteUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Dating Journal — Lời mời tham gia couple',
          text: 'Vào không gian riêng tư của hai đứa mình nhé 💗',
          url: inviteUrl,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleRegenInvite = async () => {
    setIsActionLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Mình tạo chỗ này cho hai đứa. Vào đi người yêu 💗' }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok && data.invite) {
        setInviteData(data.invite);
        const origin = window.location.origin;
        setInviteUrl(`${origin}/join/${data.invite.token}`);
      } else {
        setError(data.message || 'Không thể tạo link mới.');
      }
    } catch {
      setError('Lỗi kết nối khi tạo link mới.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!inviteData?.id) return;
    setIsActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invites/${inviteData.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setInviteData(null);
        setInviteUrl('');
      } else {
        setError(data.message || 'Không thể thu hồi link.');
      }
    } catch {
      setError('Lỗi kết nối khi thu hồi link.');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-6rem)] py-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-text-muted">Đang chuẩn bị lời mời...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-6rem)] py-6 sm:py-10">
      <div className="w-full max-w-lg rounded-[28px] border border-border bg-surface p-6 sm:p-9 shadow-[var(--shadow-elevated)] space-y-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text mb-1.5">
            Gửi lời mời cho người ấy ✨
          </h1>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Link dùng một lần. Người nhận xem trước tên bạn và xác nhận trước khi tham gia.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Link Box */}
        {inviteData ? (
          <div className="rounded-2xl border border-border bg-surface-hover/70 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-semibold text-text break-all">
                {inviteUrl || 'Chưa tạo link'}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-hover text-xs font-semibold text-text shadow-sm transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-text-muted pt-1 border-t border-border/60">
              <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                Hết hạn sau {timeLeft}
              </span>
              <span>Dùng 1 lần · Thu hồi được</span>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 border border-dashed border-border rounded-2xl">
            <p className="text-sm text-text-muted mb-3">Hiện chưa có link mời nào đang kích hoạt.</p>
            <button
              type="button"
              onClick={handleRegenInvite}
              disabled={isActionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-fg text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tạo link mời ngay
            </button>
          </div>
        )}

        {/* Action Share button */}
        {inviteData && (
          <button
            type="button"
            onClick={handleShare}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-fg font-semibold text-sm hover:bg-primary-hover shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Chia sẻ qua tin nhắn</span>
          </button>
        )}

        {/* Revoke and Regen buttons */}
        {inviteData && (
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleRevoke}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-600 font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Thu hồi link
            </button>
            <button
              type="button"
              onClick={handleRegenInvite}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 text-text-muted hover:text-text font-medium cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tạo link mới
            </button>
          </div>
        )}

        {/* 6-char backup code card */}
        {inviteData?.code && (
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 text-center space-y-2">
            <h2 className="text-xs font-semibold text-text">Không dùng được link?</h2>
            <p className="text-[11px] text-text-muted">
              Đọc mã 6 ký tự cho người ấy. Mỗi mã chỉ nhập sai tối đa 5 lần.
            </p>
            <div className="pt-1">
              <span className="font-heading text-2xl sm:text-3xl font-extrabold tracking-[0.25em] text-primary">
                {inviteData.code}
              </span>
            </div>
          </div>
        )}

        {/* Waiting status pill */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs">
          <span className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Đang đợi người ấy tham gia...
          </span>
          <span className="text-[11px] text-text-muted">Tự mở app khi xong</span>
        </div>

        <Link
          href="/dashboard"
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-border bg-surface hover:bg-surface-hover text-text font-medium text-xs transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Vào app trong lúc đợi</span>
        </Link>
      </div>
    </div>
  );
}
