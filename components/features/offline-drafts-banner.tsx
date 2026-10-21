'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import { getDrafts, syncDraft, type OfflineDraft } from '@/lib/drafts';
import { useQueryClient } from '@tanstack/react-query';
import { keys as queryKeys } from '@/lib/query/keys';
import { DraftsModal } from '@/components/features/drafts-modal';

interface OfflineDraftsBannerProps {
  coupleId: string;
}

export function OfflineDraftsBanner({ coupleId }: OfflineDraftsBannerProps) {
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    text: string;
    isError?: boolean;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const loadDrafts = useCallback(async () => {
    if (!coupleId) return;
    const items = await getDrafts(coupleId);
    setDrafts(items);
  }, [coupleId]);

  const handleSyncAll = useCallback(async () => {
    if (drafts.length === 0 || isSyncing) return;
    setIsSyncing(true);
    setLastSyncResult(null);

    let successCount = 0;
    let failCount = 0;
    let lastErrorMsg = '';

    for (const draft of drafts) {
      const res = await syncDraft(draft, coupleId);
      if (res.ok) {
        successCount++;
      } else {
        failCount++;
        if (res.error) lastErrorMsg = res.error;
      }
    }

    await loadDrafts();
    setIsSyncing(false);

    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: queryKeys.dates.scope(coupleId) });
      if (failCount === 0) {
        setLastSyncResult({
          text: `Đã đồng bộ ${successCount} kỷ niệm thành công! ✨`,
          isError: false,
        });
        setTimeout(() => setLastSyncResult(null), 5000);
      } else {
        setLastSyncResult({
          text: `Đã lưu ${successCount} kỷ niệm, nhưng còn ${failCount} bản nháp gặp lỗi (${lastErrorMsg}). Hãy bấm "Xem & Quản lý" để kiểm tra.`,
          isError: true,
        });
      }
    } else if (failCount > 0) {
      setLastSyncResult({
        text: `Đồng bộ chưa thành công (${lastErrorMsg || 'vui lòng kiểm tra kết nối'}). Hãy bấm "Xem & Quản lý" để xem chi tiết hoặc xoá bản nháp.`,
        isError: true,
      });
    }
  }, [drafts, isSyncing, coupleId, queryClient, loadDrafts]);

  useEffect(() => {
    loadDrafts();

    const handleOnline = () => {
      handleSyncAll();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [loadDrafts, handleSyncAll]);

  if (drafts.length === 0 && !lastSyncResult) return null;

  return (
    <>
      <div className="mb-4 space-y-2">
        {drafts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-text">
            <div className="flex items-center gap-2.5">
              <WifiOff size={18} className="text-[var(--color-warning)] shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  Bạn có <span className="font-bold text-primary">{drafts.length} bản hẹn hò nháp</span> trên thiết bị này.
                </p>
                <p className="text-xs text-text-muted">
                  Bản nháp được lưu tạm khi kết nối mạng chưa ổn định.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-border bg-surface hover:bg-surface-hover text-text text-xs font-semibold transition-colors"
              >
                <FileText size={13} />
                <span>Xem & Quản lý</span>
              </button>

              <button
                type="button"
                onClick={handleSyncAll}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-primary text-primary-fg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
              </button>
            </div>
          </div>
        )}

        {lastSyncResult && (
          <div
            className={`flex items-start sm:items-center justify-between gap-2 p-3 rounded-[var(--radius-md)] text-xs border ${
              lastSyncResult.isError
                ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                : 'bg-[var(--color-success)]/10 border-[var(--color-success)]/20 text-text'
            }`}
          >
            <div className="flex items-center gap-2">
              {lastSyncResult.isError ? (
                <AlertCircle size={16} className="shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="text-[var(--color-success)] shrink-0" />
              )}
              <span>{lastSyncResult.text}</span>
            </div>

            {lastSyncResult.isError && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="underline font-semibold shrink-0 hover:opacity-80"
              >
                Mở quản lý
              </button>
            )}
          </div>
        )}
      </div>

      <DraftsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        drafts={drafts}
        coupleId={coupleId}
        onDraftsUpdated={loadDrafts}
      />
    </>
  );
}
