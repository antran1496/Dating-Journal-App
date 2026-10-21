'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Trash2,
  Edit3,
  AlertCircle,
  MapPin,
  Calendar,
  Coins,
  FileText,
  ImageIcon,
} from 'lucide-react';
import {
  type OfflineDraft,
  syncDraft,
  deleteDraft,
  clearAllDrafts,
} from '@/lib/drafts';
import { useRouter } from 'next/navigation';

interface DraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: OfflineDraft[];
  coupleId: string;
  onDraftsUpdated: () => void;
}

export function DraftsModal({
  isOpen,
  onClose,
  drafts,
  coupleId,
  onDraftsUpdated,
}: DraftsModalProps) {
  const router = useRouter();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSyncSingle = async (draft: OfflineDraft) => {
    setSyncingId(draft.id);
    setActionError(null);
    try {
      const res = await syncDraft(draft, coupleId);
      if (!res.ok) {
        setActionError(res.error || 'Đồng bộ bản nháp thất bại');
      }
      onDraftsUpdated();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Lỗi đồng bộ');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteSingle = async (draftId: string) => {
    if (!window.confirm('Bạn có chắc muốn xoá bản nháp này?')) return;
    await deleteDraft(draftId);
    onDraftsUpdated();
  };

  const handleClearAll = async () => {
    if (!window.confirm('Bạn có chắc muốn xoá toàn bộ các bản nháp trên thiết bị này?')) {
      return;
    }
    await clearAllDrafts();
    onDraftsUpdated();
    onClose();
  };

  const handleEditDraft = (draftId: string) => {
    onClose();
    router.push(`/dates/new?draftId=${encodeURIComponent(draftId)}`);
  };

  const handleSyncAll = async () => {
    if (drafts.length === 0 || isSyncingAll) return;
    setIsSyncingAll(true);
    setActionError(null);

    let failCount = 0;
    for (const draft of drafts) {
      const res = await syncDraft(draft, coupleId);
      if (!res.ok) failCount++;
    }

    setIsSyncingAll(false);
    onDraftsUpdated();

    if (failCount > 0) {
      setActionError(`Còn ${failCount} bản nháp chưa thể đồng bộ. Vui lòng kiểm tra lại.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[var(--radius-xl)] bg-surface border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-hover/30">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold text-text">Bản hẹn hò nháp</h2>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {drafts.length}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Lưu tạm trên thiết bị này khi mạng yếu hoặc chưa gửi được
            </p>
          </div>

          <div className="flex items-center gap-2">
            {drafts.length > 0 && (
              <button
                type="button"
                onClick={handleSyncAll}
                disabled={isSyncingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-primary text-primary-fg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <RefreshCw size={13} className={isSyncingAll ? 'animate-spin' : ''} />
                <span>{isSyncingAll ? 'Đang đồng bộ...' : 'Đồng bộ tất cả'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[var(--radius-md)] text-text-muted hover:text-text hover:bg-surface transition-colors"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Global Action Error */}
        {actionError && (
          <div className="mx-5 mt-4 p-3 rounded-[var(--radius-md)] bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {drafts.length === 0 ? (
            <div className="text-center py-12 text-text-muted space-y-2">
              <p className="text-sm font-medium">Không có bản nháp nào trên thiết bị này ✨</p>
              <p className="text-xs">Tất cả buổi hẹn của bạn đều đã được lưu an toàn lên đám mây.</p>
            </div>
          ) : (
            drafts.map((draft, idx) => {
              const displayDate =
                draft.form.date_time ||
                new Date(draft.createdAt).toLocaleDateString('vi-VN');
              const location =
                draft.places?.[0]?.name || draft.form.location_name;
              const noteText = draft.form.note || draft.form.pros;
              const isSyncingThis = syncingId === draft.id;
              const mediaCount =
                (draft.mediaFiles?.length || 0) + (draft.uploadedMedia?.length || 0);

              return (
                <div
                  key={draft.id || idx}
                  className="p-4 rounded-[var(--radius-lg)] bg-surface border border-border shadow-sm hover:border-primary/40 transition-colors space-y-3"
                >
                  {/* Top info row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-text">
                      <Calendar size={14} className="text-primary" />
                      <span>{displayDate}</span>
                      {draft.status === 'failed' && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-medium border border-red-500/20">
                          Lỗi đồng bộ
                        </span>
                      )}
                      {draft.status === 'syncing' && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-medium">
                          Đang gửi...
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSyncSingle(draft)}
                        disabled={isSyncingThis || isSyncingAll}
                        title="Đồng bộ lại bản nháp này"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-md)] bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw size={12} className={isSyncingThis ? 'animate-spin' : ''} />
                        <span>{isSyncingThis ? 'Đang gửi...' : 'Đồng bộ'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditDraft(draft.id)}
                        title="Mở chỉnh sửa bản nháp này"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-md)] border border-border hover:bg-surface-hover text-text text-xs font-medium transition-colors"
                      >
                        <Edit3 size={12} />
                        <span>Sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSingle(draft.id)}
                        title="Xoá bản nháp này"
                        className="p-1 rounded-[var(--radius-md)] text-text-muted hover:text-red-600 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Location & Spend */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    {location && (
                      <div className="flex items-center gap-1 text-text">
                        <MapPin size={13} className="text-primary shrink-0" />
                        <span className="truncate max-w-[240px] font-medium">{location}</span>
                      </div>
                    )}
                    {draft.form.spend_vnd ? (
                      <div className="flex items-center gap-1">
                        <Coins size={13} className="text-primary shrink-0" />
                        <span>
                          {new Intl.NumberFormat('vi-VN').format(Number(draft.form.spend_vnd))} đ
                        </span>
                      </div>
                    ) : null}
                    {mediaCount > 0 && (
                      <div className="flex items-center gap-1">
                        <ImageIcon size={13} className="text-primary shrink-0" />
                        <span>{mediaCount} tệp đính kèm</span>
                      </div>
                    )}
                  </div>

                  {/* Note / Content snippet */}
                  {noteText && (
                    <div className="p-2.5 rounded-[var(--radius-md)] bg-surface-hover/50 text-xs text-text border border-border/50 line-clamp-2">
                      <FileText size={12} className="inline mr-1 text-text-muted" />
                      {noteText}
                    </div>
                  )}

                  {/* Exact error reason if failed */}
                  {draft.lastError && (
                    <div className="p-2.5 rounded-[var(--radius-md)] bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs space-y-0.5">
                      <div className="font-semibold flex items-center gap-1">
                        <AlertCircle size={13} />
                        <span>Chi tiết lỗi từ máy chủ:</span>
                      </div>
                      <p className="break-words font-mono text-[11px] opacity-90">
                        {draft.lastError}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-hover/20 text-xs">
          {drafts.length > 0 ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              <Trash2 size={13} />
              <span>Xoá tất cả bản nháp</span>
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[var(--radius-md)] border border-border text-text hover:bg-surface-hover transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
