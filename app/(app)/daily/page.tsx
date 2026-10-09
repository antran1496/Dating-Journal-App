'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Send, CheckCircle2, Clock, Lock, Sparkles, MessageCircleHeart } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useSessionUser } from '@/components/providers/session-provider';
import { useCouple } from '@/hooks/use-couple';
import { useDailyQuestion, useSubmitDailyAnswer } from '@/hooks/use-daily';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function DailyQuestionPage() {
  const { user } = useSessionUser();
  const { couple } = useCouple();
  const { data, isLoading, refetch } = useDailyQuestion(couple?.id);
  const submitMutation = useSubmitDailyAnswer(couple?.id);

  const [answerText, setAnswerText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const today = data?.today;
  const question = today?.question;
  const myAnswer = today?.myAnswer;
  const partnerAnswer = today?.partnerAnswer;

  const partnerMember = couple?.couple_members?.find((m) => m.profile_id !== user?.id);
  const currentMember = couple?.couple_members?.find((m) => m.profile_id === user?.id);

  const partnerName =
    partnerMember?.nickname || partnerMember?.profile?.display_name || 'Người ấy';
  const myName =
    currentMember?.nickname || currentMember?.profile?.display_name || 'Bạn';

  const myDone = today?.myStatus === 'answered';
  const partnerDone = today?.partnerStatus === 'answered';
  const bothDone = myDone && partnerDone;

  useEffect(() => {
    if (myAnswer?.body) {
      setAnswerText(myAnswer.body);
    }
  }, [myAnswer?.body]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || submitMutation.isPending) return;

    try {
      await submitMutation.mutateAsync(answerText.trim());
      setIsEditing(false);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi gửi câu trả lời');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <LoadingSkeleton variant="text" width="200px" height="32px" />
          <LoadingSkeleton variant="rect" width="120px" height="32px" className="rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LoadingSkeleton variant="rect" height="300px" className="rounded-[var(--radius-xl)]" />
          <LoadingSkeleton variant="rect" height="300px" className="rounded-[var(--radius-xl)]" />
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-3">
        <MessageCircleHeart size={48} className="mx-auto text-primary opacity-60" />
        <h2 className="font-heading text-xl font-bold text-text">Không có câu hỏi cho hôm nay</h2>
        <p className="text-text-muted text-sm">Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text">
            Câu hỏi hằng ngày 💌
          </h1>
          <p className="text-text-muted text-sm sm:text-base mt-1">
            Cả hai trả lời xong thì câu trả lời mới được mở.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold text-sm shrink-0 self-start sm:self-auto shadow-xs">
          <Flame size={18} className="fill-orange-500 stroke-orange-500" />
          <span>Chuỗi {today.streak} ngày</span>
        </span>
      </div>

      {/* Main Grid: Input card & Status/Reveal card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: Today Question & Answer input */}
        <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-6 shadow-xs space-y-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Câu hỏi hôm nay
          </span>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-text leading-snug">
            {question.text_vi}
          </h2>

          {myDone && !isEditing ? (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-[var(--radius-lg)] bg-primary/5 border border-primary/20 space-y-1.5">
                <span className="text-xs font-semibold text-primary">Câu trả lời của bạn:</span>
                <p className="text-text whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                  {myAnswer?.body}
                </p>
              </div>

              {!partnerDone && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-text-muted hover:text-primary transition-colors cursor-pointer"
                >
                  Chỉnh sửa câu trả lời
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label htmlFor="dailyAns" className="block text-xs font-semibold text-text-muted mb-1.5">
                  Câu trả lời của bạn
                </label>
                <textarea
                  id="dailyAns"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  maxLength={300}
                  rows={4}
                  placeholder="Viết vài dòng thôi cũng được..."
                  className="w-full rounded-[var(--radius-lg)] p-3.5 text-sm bg-surface-hover/50 border border-border focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                />
                <div className="text-right text-[11px] text-text-muted mt-1">
                  {answerText.length}/300
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!answerText.trim() || submitMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  <Send size={15} />
                  <span>{submitMutation.isPending ? 'Đang gửi...' : 'Gửi câu trả lời'}</span>
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setAnswerText(myAnswer?.body || '');
                    }}
                    className="px-4 py-2.5 text-sm text-text-muted hover:text-text cursor-pointer"
                  >
                    Huỷ
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Right: Status & Reveal */}
        <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-6 shadow-xs space-y-6">
          <h3 className="font-heading text-lg font-bold text-text">Trạng thái</h3>

          {/* Member 1 Status */}
          <div className="flex items-center justify-between p-3 rounded-[var(--radius-lg)] bg-surface-hover/60 border border-border/80">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={currentMember?.profile?.avatar_url ?? undefined}
                name={myName}
                size="sm"
              />
              <span className="font-semibold text-sm text-text">{myName} (Bạn)</span>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                myDone
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}
            >
              {myDone ? 'Đã trả lời' : 'Chưa trả lời'}
            </span>
          </div>

          {/* Member 2 Status */}
          <div className="flex items-center justify-between p-3 rounded-[var(--radius-lg)] bg-surface-hover/60 border border-border/80">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={partnerMember?.profile?.avatar_url ?? undefined}
                name={partnerName}
                size="sm"
              />
              <span className="font-semibold text-sm text-text">{partnerName}</span>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                partnerDone
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}
            >
              {partnerDone ? 'Đã trả lời' : 'Chưa trả lời'}
            </span>
          </div>

          {/* Reveal or Locked Banner */}
          {bothDone && partnerAnswer ? (
            <div className="p-4 rounded-[var(--radius-lg)] bg-gradient-to-br from-accent/15 to-primary/15 border border-primary/30 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles size={15} />
                <span>Câu trả lời của {partnerName}:</span>
              </div>
              <p className="text-text whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                {partnerAnswer.body}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-[var(--radius-lg)] bg-surface-hover/40 border border-dashed border-border flex items-start gap-3">
              <Lock size={18} className="text-text-muted mt-0.5 shrink-0" />
              <p className="text-xs text-text-muted leading-relaxed">
                {myDone
                  ? `Đợi ${partnerName} trả lời xong thì câu trả lời của hai bạn sẽ cùng mở ra.`
                  : `Đợi bạn trả lời xong thì câu trả lời của ${partnerName} sẽ mở ra.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Questions Section */}
      {data?.recent && data.recent.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="font-heading text-lg sm:text-xl font-bold text-text">
            Những câu gần đây
          </h2>

          <div className="space-y-2.5">
            {data.recent.map((item) => {
              const isBothDone = item.status === 'both_done';
              const isMissed = item.status === 'missed';

              return (
                <div
                  key={item.day}
                  className="flex items-center justify-between p-3.5 rounded-[var(--radius-lg)] bg-surface border border-border shadow-2xs hover:border-primary/30 transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-xs text-text-muted mb-0.5">{item.day}</p>
                    <p className="font-medium text-sm text-text line-clamp-1">
                      {item.question?.text_vi || 'Câu hỏi ngày'}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                      isBothDone
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : isMissed
                        ? 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {isBothDone ? 'Cả hai đã xong' : isMissed ? 'Bỏ lỡ' : 'Đang chờ'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
