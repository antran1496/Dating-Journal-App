'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getDrafts, syncDraft, type OfflineDraft } from '@/lib/drafts';
import { useQueryClient } from '@tanstack/react-query';
import { keys as queryKeys } from '@/lib/query/keys';

interface OfflineDraftsBannerProps {
  coupleId: string;
}

export function OfflineDraftsBanner({ coupleId }: OfflineDraftsBannerProps) {
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);
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

    for (const draft of drafts) {
      const res = await syncDraft(draft);
      if (res.ok) {
        successCount++;
      } else {
        failCount++;
      }
    }

    await loadDrafts();
    setIsSyncing(false);

    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: queryKeys.dates.scope(coupleId) });
      setLastSyncResult(`Đã đồng bộ ${successCount} kỷ niệm thành công! ✨`);
      setTimeout(() => setLastSyncResult(null), 5000);
    } else if (failCount > 0) {
      setLastSyncResult('Đồng bộ chưa thành công, vui lòng kiểm tra kết nối mạng.');
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
    <div className="mb-4 space-y-2">
      {drafts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-text">
          <div className="flex items-center gap-2.5">
            <WifiOff size={18} className="text-[var(--color-warning)] shrink-0" />
            <p className="text-sm font-medium">
              Mạng hơi yếu — Mình giữ {drafts.length} bản nháp cho bạn, thử lại sau nhé.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-primary text-primary-fg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
            </button>
          </div>
        </div>
      )}

      {lastSyncResult && (
        <div className="flex items-center gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-text text-xs">
          <CheckCircle2 size={16} className="text-[var(--color-success)]" />
          <span>{lastSyncResult}</span>
        </div>
      )}
    </div>
  );
}
