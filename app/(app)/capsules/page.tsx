'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Lock, Unlock, Plus, Trash2, Calendar, AlertCircle, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useSessionUser } from '@/components/providers/session-provider';

interface CapsuleItem {
  id: string;
  couple_id: string;
  created_by: string;
  creator_name: string;
  title: string;
  unlock_on: string;
  opened_at: string | null;
  created_at: string;
  is_unlocked: boolean;
  body?: string | null;
  media_urls?: string[];
}

export default function CapsulesPage() {
  const { user } = useSessionUser();
  const { toast } = useToast();

  const [capsules, setCapsules] = useState<CapsuleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCapsule, setActiveCapsule] = useState<CapsuleItem | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [unlockOn, setUnlockOn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tomorrow] = useState(() => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const loadCapsules = useCallback(async () => {
    try {
      const res = await fetch('/api/capsules');
      if (res.ok) {
        const json = await res.json();
        setCapsules(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load capsules:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCapsules();
  }, [loadCapsules]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !unlockOn) {
      toast({ type: 'error', title: 'Vui lòng điền đầy đủ tiêu đề, nội dung và ngày mở khóa' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/capsules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          unlock_on: unlockOn,
          media_urls: [],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Không thể tạo time capsule');
      }

      toast({ type: 'success', title: 'Đã khóa time capsule thành công! 💌' });
      setIsModalOpen(false);
      setTitle('');
      setBody('');
      setUnlockOn('');
      loadCapsules();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast({ type: 'error', title: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCapsule = async (capsule: CapsuleItem) => {
    if (!capsule.is_unlocked) {
      toast({ type: 'info', title: `Hộp thư vẫn đang khóa cho tới ngày ${capsule.unlock_on} 🔒` });
      return;
    }

    try {
      const res = await fetch(`/api/capsules/${capsule.id}/open`, { method: 'POST' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Không thể mở thư');
      }
      const json = await res.json();
      setActiveCapsule(json.data);
      loadCapsules();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast({ type: 'error', title: msg });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn huỷ bức thư này không?')) return;

    try {
      const res = await fetch(`/api/capsules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Không thể xoá thư');
      toast({ type: 'success', title: 'Đã xoá thư thành công' });
      loadCapsules();
    } catch {
      toast({ type: 'error', title: 'Chỉ người viết mới được xoá trước ngày mở khóa' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Time capsule 💌
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Viết thư hoặc cất ảnh, khóa đến ngày hai bạn hẹn.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="gap-2 shadow-glow w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Viết thư mới
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : capsules.length === 0 ? (
        <Card className="p-12 text-center space-y-4 border border-dashed border-border bg-surface">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-lg text-text">Chưa có Time Capsule nào</h3>
            <p className="text-text-muted text-sm max-w-sm mx-auto mt-1">
              Hãy gửi gắm những lời yêu thương hay lời hứa tương lai. Thư sẽ được niêm phong cho tới ngày hẹn!
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Viết bức thư đầu tiên
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {capsules.map((item) => {
            const isOwner = user?.id === item.created_by;
            const canOpen = item.is_unlocked;

            return (
              <Card
                key={item.id}
                onClick={() => canOpen && handleOpenCapsule(item)}
                className={`p-5 border transition-all cursor-pointer ${
                  canOpen
                    ? 'border-primary/40 hover:border-primary bg-surface shadow-sm'
                    : 'border-border/80 bg-surface-hover/50 hover:bg-surface-hover'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-3 rounded-2xl shrink-0 ${
                        canOpen ? 'bg-primary/10 text-primary' : 'bg-surface border border-border text-text-muted'
                      }`}
                    >
                      {canOpen ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading font-bold text-base text-text truncate">
                          {item.title}
                        </h3>
                        {item.opened_at ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Đã mở
                          </span>
                        ) : canOpen ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 animate-pulse">
                            Sẵn sàng mở ngay!
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-border/60 text-text-muted">
                            🔒 Đã khóa
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
                        <span>{item.creator_name} viết</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Mở ngày {item.unlock_on}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {canOpen ? (
                      <Button
                        size="sm"
                        variant={item.opened_at ? 'secondary' : 'primary'}
                        onClick={() => handleOpenCapsule(item)}
                        className="text-xs h-8 px-3"
                      >
                        {item.opened_at ? 'Đọc lại' : 'Mở thư 💌'}
                      </Button>
                    ) : isOwner && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-2 text-text-muted hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Huỷ bức thư này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Write New Capsule */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleCreate} className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-text">Viết Time Capsule mới</h2>
              <p className="text-xs text-text-muted">Gửi tương lai một phong thư tình cảm</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text uppercase tracking-wider block mb-1.5">
                Tiêu đề thư
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="VD: Lời hứa kỷ niệm 1 năm, Gửi em ngày sinh nhật..."
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text uppercase tracking-wider block mb-1.5">
                Nội dung bức thư
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={5000}
                rows={5}
                placeholder="Viết những suy nghĩ, lời nhắn nhủ chân thành mà bạn muốn người ấy đọc vào ngày hẹn..."
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary resize-none"
                required
              />
              <span className="text-[11px] text-text-muted float-right mt-1">{body.length}/5000</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-text uppercase tracking-wider block mb-1.5">
                Mở vào ngày
              </label>
              <input
                type="date"
                value={unlockOn}
                min={tomorrow}
                onChange={(e) => setUnlockOn(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Crucial Spec Warning */}
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Lưu ý:</strong> Sau khi khoá, cả hai sẽ không đọc được cho tới ngày mở.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Niêm phong & Khóa thư
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Read Unlocked Capsule */}
      <Modal isOpen={Boolean(activeCapsule)} onClose={() => setActiveCapsule(null)}>
        {activeCapsule && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" /> Thư từ {activeCapsule.creator_name}
                </span>
                <h2 className="font-heading font-bold text-xl text-text">{activeCapsule.title}</h2>
                <p className="text-xs text-text-muted">Mở vào ngày {activeCapsule.unlock_on}</p>
              </div>
            </div>

            <div className="bg-surface-hover/50 p-5 rounded-2xl border border-border/60">
              <p className="text-sm sm:text-base text-text leading-relaxed whitespace-pre-wrap font-sans">
                {activeCapsule.body}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={() => setActiveCapsule(null)}>
                Đóng lại
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
