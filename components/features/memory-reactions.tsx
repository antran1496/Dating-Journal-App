'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Send, Trash2, Edit2, Eye, Check, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Avatar } from '@/components/ui/avatar';
import { useSessionUser } from '@/components/providers/session-provider';
import { useCouple } from '@/hooks/use-couple';
import { useDateById } from '@/hooks/use-dates';
import { keys as queryKeys } from '@/lib/query/keys';
import type { DateReaction, DateComment, DateView } from '@/types';

interface MemoryReactionsProps {
  dateId: string;
  coupleId: string;
  createdBy: string;
}

export function MemoryReactions({ dateId, coupleId, createdBy }: MemoryReactionsProps) {
  const { user } = useSessionUser();
  const { couple } = useCouple();
  const queryClient = useQueryClient();
  const { data: date } = useDateById(dateId);

  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);

  // Auto record view if current user is not creator
  useEffect(() => {
    if (user && user.id !== createdBy) {
      fetch(`/api/dates/${dateId}/view`, { method: 'POST' }).catch((err) => {
        console.error('Record view error:', err);
      });
    }
  }, [user, dateId, createdBy]);

  const reactions: DateReaction[] = date?.reactions || [];
  const comments: DateComment[] = (date?.comments || []).filter((c) => !c.deleted_at);
  const views: DateView[] = date?.views || [];

  const hasReacted = user ? reactions.some((r) => r.profile_id === user.id) : false;
  const partnerMember = couple?.couple_members?.find((m) => m.profile_id !== user?.id);
  const partnerName =
    partnerMember?.nickname || partnerMember?.profile?.display_name || 'Người ấy';

  // Find partner's view
  const partnerView = user ? views.find((v) => v.profile_id !== user.id) : null;

  // Toggle Reaction with Optimistic Update
  const handleToggleReaction = async () => {
    if (!user) return;

    // Previous state snapshot
    const previousDate = date;

    // Optimistic cache update
    queryClient.setQueryData(queryKeys.dates.detail(dateId), (old: typeof date) => {
      if (!old) return old;
      const currentReactions = old.reactions || [];
      const alreadyReacted = currentReactions.some((r) => r.profile_id === user.id);

      const newReactions = alreadyReacted
        ? currentReactions.filter((r) => r.profile_id !== user.id)
        : [
            ...currentReactions,
            {
              date_id: dateId,
              profile_id: user.id,
              emoji: '💗',
              created_at: new Date().toISOString(),
            },
          ];

      return {
        ...old,
        reactions: newReactions,
      };
    });

    try {
      const res = await fetch(`/api/dates/${dateId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: '💗' }),
      });
      if (!res.ok) {
        throw new Error('Không thể thả tim');
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dates.detail(dateId) });
    } catch (err) {
      console.error(err);
      // Rollback on failure
      if (previousDate) {
        queryClient.setQueryData(queryKeys.dates.detail(dateId), previousDate);
      }
    }
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/dates/${dateId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentText.trim() }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Lỗi khi gửi bình luận');
      }

      setCommentText('');
      queryClient.invalidateQueries({ queryKey: queryKeys.dates.detail(dateId) });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi gửi bình luận');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bạn có chắc muốn xoá bình luận này?')) return;

    try {
      const res = await fetch(`/api/dates/${dateId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Không thể xoá');
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dates.detail(dateId) });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể xoá bình luận');
    }
  };

  // Start Edit Comment
  const handleStartEdit = (comment: DateComment) => {
    setEditingCommentId(comment.id);
    setEditBody(comment.body);
  };

  // Save Edit Comment
  const handleSaveEdit = async (commentId: string) => {
    if (!editBody.trim() || isUpdatingComment) return;

    setIsUpdatingComment(true);
    try {
      const res = await fetch(`/api/dates/${dateId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: editBody.trim() }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Không thể cập nhật');
      }
      setEditingCommentId(null);
      setEditBody('');
      queryClient.invalidateQueries({ queryKey: queryKeys.dates.detail(dateId) });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi sửa bình luận');
    } finally {
      setIsUpdatingComment(false);
    }
  };

  return (
    <div className="rounded-[var(--radius-xl)] bg-surface border border-border overflow-hidden shadow-xs divide-y divide-border/60">
      {/* Top action bar: Thả tim + Đã xem indicator */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleReaction}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer ${
              hasReacted
                ? 'bg-rose-500/15 text-rose-500 ring-1 ring-rose-500/30'
                : 'bg-surface-hover text-text-muted hover:text-text'
            }`}
          >
            <Heart
              size={17}
              className={`transition-transform duration-200 ${
                hasReacted ? 'fill-rose-500 stroke-rose-500 scale-110' : ''
              }`}
            />
            <span>{hasReacted ? 'Đã thả tim' : 'Thả tim'}</span>
            {reactions.length > 0 && (
              <span className="font-mono text-xs opacity-80">({reactions.length})</span>
            )}
          </button>

          <span className="text-xs text-text-muted flex items-center gap-1.5">
            <MessageCircle size={15} />
            <span>{comments.length} bình luận</span>
          </span>
        </div>

        {/* Seen indicator from date_views */}
        <div className="text-xs text-text-muted flex items-center gap-1.5">
          {partnerView ? (
            <span className="flex items-center gap-1 text-primary font-medium" title={format(new Date(partnerView.seen_at), 'dd/MM/yyyy HH:mm')}>
              <Eye size={13} className="shrink-0" />
              <span>{partnerName} đã xem</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-text-muted/70">
              <Eye size={13} className="shrink-0" />
              <span>Chỉ hai bạn</span>
            </span>
          )}
        </div>
      </div>

      {/* Comments List & Form */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Comment list */}
        {comments.length > 0 && (
          <div className="space-y-3.5">
            {comments.map((c) => {
              const isAuthor = user && c.author_id === user.id;
              const authorName =
                c.author?.display_name ||
                (isAuthor ? 'Bạn' : partnerName);
              const isEditing = editingCommentId === c.id;

              return (
                <div key={c.id} className="flex items-start gap-3 text-xs sm:text-sm">
                  <Avatar
                    src={c.author?.avatar_url ?? undefined}
                    name={authorName}
                    size="sm"
                    className="shrink-0 mt-0.5"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="bg-surface-hover/70 rounded-[var(--radius-lg)] p-3 border border-border/70">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-text truncate">
                          {authorName}
                        </span>
                        <span className="text-[11px] text-text-muted shrink-0 ml-2">
                          {formatDistanceToNow(new Date(c.created_at), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2 mt-2">
                          <textarea
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            maxLength={500}
                            rows={2}
                            className="w-full text-xs sm:text-sm p-2 rounded-md bg-surface border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingCommentId(null)}
                              className="px-2 py-1 text-xs text-text-muted hover:text-text cursor-pointer flex items-center gap-1"
                            >
                              <X size={13} /> Huỷ
                            </button>
                            <button
                              type="button"
                              disabled={isUpdatingComment || !editBody.trim()}
                              onClick={() => handleSaveEdit(c.id)}
                              className="px-2.5 py-1 text-xs bg-primary text-white rounded font-medium cursor-pointer flex items-center gap-1 disabled:opacity-50"
                            >
                              <Check size={13} /> Lưu
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-text whitespace-pre-wrap leading-relaxed">
                          {c.body}
                        </p>
                      )}
                    </div>

                    {/* Author actions (edit / delete) */}
                    {isAuthor && !isEditing && (
                      <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] text-text-muted">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(c)}
                          className="hover:text-primary transition-colors cursor-pointer flex items-center gap-0.5"
                        >
                          <Edit2 size={11} /> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          className="hover:text-destructive transition-colors cursor-pointer flex items-center gap-0.5"
                        >
                          <Trash2 size={11} /> Xoá
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* New comment input */}
        <form onSubmit={handleAddComment} className="flex flex-col gap-2 pt-1">
          <div className="relative">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Viết bình luận cho buổi hẹn..."
              maxLength={500}
              rows={2}
              className="w-full rounded-[var(--radius-lg)] p-3 text-xs sm:text-sm bg-surface-hover/50 border border-border focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
            />
            <div className="flex items-center justify-between text-[11px] text-text-muted px-1 mt-1">
              <span>{commentText.length}/500</span>
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmittingComment}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-primary text-white font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <Send size={13} />
                <span>{isSubmittingComment ? 'Đang gửi...' : 'Gửi'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
