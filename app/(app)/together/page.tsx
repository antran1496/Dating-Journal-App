'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  CalendarPlus,
  Coins,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useCouple } from '@/hooks/use-couple';
import {
  useWishlist,
  useCreateWishlistItem,
  useToggleWishlistItem,
  useDeleteWishlistItem,
} from '@/hooks/use-wishlist';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import type { WishlistItem } from '@/types';

export default function WishlistPage() {
  const { couple } = useCouple();
  const { data: items = [], isLoading } = useWishlist(couple?.id);
  const createMutation = useCreateWishlistItem(couple?.id);
  const toggleMutation = useToggleWishlistItem(couple?.id);
  const deleteMutation = useDeleteWishlistItem(couple?.id);

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [budgetStr, setBudgetStr] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || createMutation.isPending) return;

    const budget = budgetStr ? parseInt(budgetStr.replace(/\D/g, ''), 10) : undefined;

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        note: note.trim() || undefined,
        budget_vnd: budget,
      });

      setTitle('');
      setNote('');
      setBudgetStr('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi thêm mục mới');
    }
  };

  const pendingItems = items.filter((i) => !i.done_at);
  const doneItems = items.filter((i) => !!i.done_at);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <LoadingSkeleton variant="text" width="220px" height="32px" />
        <LoadingSkeleton variant="rect" height="140px" className="rounded-[var(--radius-xl)]" />
        <div className="space-y-3">
          <LoadingSkeleton variant="rect" height="60px" className="rounded-[var(--radius-lg)]" />
          <LoadingSkeleton variant="rect" height="60px" className="rounded-[var(--radius-lg)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text">
          Cùng nhau ✨
        </h1>
        <p className="text-text-muted text-sm sm:text-base mt-1">
          Những điều hai bạn muốn cùng nhau làm và trải nghiệm
        </p>
      </div>

      {/* Add New Wish Item Form */}
      <form
        onSubmit={handleCreate}
        className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Điều muốn thử cùng nhau (vd: Đi picnic hồ Tây, Học làm gốm...)"
            maxLength={120}
            className="flex-1 rounded-[var(--radius-lg)] px-4 py-2.5 text-sm bg-surface-hover/50 border border-border focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          <button
            type="submit"
            disabled={!title.trim() || createMutation.isPending}
            className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-[var(--radius-lg)] bg-primary text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-xs"
          >
            <Plus size={16} />
            <span>Thêm</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs text-text-muted mb-1">Ghi chú (tùy chọn)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Gợi ý địa chỉ, mùa thích hợp..."
              className="w-full rounded-[var(--radius-lg)] px-3.5 py-2 text-xs sm:text-sm bg-surface-hover/50 border border-border focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">Ngân sách dự kiến (tùy chọn)</label>
            <input
              type="text"
              inputMode="numeric"
              value={budgetStr}
              onChange={(e) => setBudgetStr(e.target.value)}
              placeholder="vd: 300000"
              className="w-full rounded-[var(--radius-lg)] px-3.5 py-2 text-xs sm:text-sm bg-surface-hover/50 border border-border focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>
      </form>

      {/* Section: Chưa làm */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg sm:text-xl font-bold text-text flex items-center gap-2">
            <span>🎯</span> Chưa làm ({pendingItems.length})
          </h2>
          <Link
            href="/chat"
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            <Sparkles size={13} />
            <span>Nhờ Cupid gợi ý buổi hẹn</span>
          </Link>
        </div>

        {pendingItems.length === 0 ? (
          <div className="py-8 px-4 rounded-[var(--radius-xl)] bg-surface border border-dashed border-border text-center space-y-1">
            <p className="text-sm font-medium text-text">Chưa có mục nào đang chờ</p>
            <p className="text-xs text-text-muted">
              Hãy thêm những ý tưởng hẹn hò hai bạn muốn thử ở phía trên nhé!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between p-3.5 sm:p-4 rounded-[var(--radius-xl)] bg-surface border border-border shadow-2xs hover:border-primary/40 transition-all"
              >
                <div className="flex items-start gap-3 min-w-0 pr-3">
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate({ id: item.id, done: true })}
                    className="text-text-muted hover:text-emerald-500 transition-colors mt-0.5 shrink-0 cursor-pointer"
                    title="Đánh dấu hoàn thành"
                  >
                    <Circle size={20} />
                  </button>

                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base text-text leading-snug">
                      {item.title}
                    </p>
                    {item.note && (
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {item.budget_vnd && (
                    <span className="text-xs font-mono text-text-muted bg-surface-hover px-2.5 py-1 rounded-full border border-border">
                      {item.budget_vnd.toLocaleString('vi-VN')}đ
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="text-text-muted/60 hover:text-destructive transition-colors p-1 rounded-md opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Xoá mục này"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: Đã làm */}
      {doneItems.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/70">
          <h2 className="font-heading text-lg sm:text-xl font-bold text-text flex items-center gap-2">
            <span>🎉</span> Đã làm ({doneItems.length})
          </h2>

          <div className="space-y-2.5">
            {doneItems.map((item) => {
              const newDateUrl = `/dates/new?title=${encodeURIComponent(
                item.title
              )}${item.budget_vnd ? `&spend=${item.budget_vnd}` : ''}`;

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-[var(--radius-xl)] bg-surface/70 border border-border/70 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleMutation.mutate({ id: item.id, done: false })}
                      className="text-emerald-500 hover:text-text-muted transition-colors shrink-0 cursor-pointer"
                      title="Bỏ đánh dấu hoàn thành"
                    >
                      <CheckCircle2 size={20} className="fill-emerald-500/20" />
                    </button>

                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base text-text line-through opacity-70">
                        {item.title}
                      </p>
                      {item.note && (
                        <p className="text-xs text-text-muted mt-0.5 line-through opacity-60">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Suggestion action: Ghi lại buổi hẹn này? */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {item.linked_date_id ? (
                      <Link
                        href={`/dates/${item.linked_date_id}`}
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full"
                      >
                        <span>Xem kỷ niệm</span>
                        <ArrowRight size={13} />
                      </Link>
                    ) : (
                      <Link
                        href={newDateUrl}
                        className="text-xs text-primary font-semibold hover:underline flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-full"
                        title="Tạo buổi hẹn ghi lại khoảnh khắc này"
                      >
                        <CalendarPlus size={14} />
                        <span>Ghi lại buổi hẹn này?</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="text-text-muted/60 hover:text-destructive transition-colors p-1 rounded-md cursor-pointer ml-1"
                      title="Xoá mục"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
