'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Download,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Trash2,
  LogOut,
  FileArchive,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { signOut } from 'next-auth/react';

export default function DataLifecyclePage() {
  const { toast } = useToast();
  const router = useRouter();

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Leave couple state
  const [leaveStep, setLeaveStep] = useState<0 | 1 | 2>(0);
  const [leaveConfirmText, setLeaveConfirmText] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);

  // Delete account state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Export Data Handler
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/export', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Xuất dữ liệu thất bại');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const nowStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `dating-journal-export-${nowStr}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ type: 'success', title: 'Đã tải xuống file ZIP dữ liệu thành công' });
    } catch (err: unknown) {
      toast({
        type: 'error',
        title: 'Lỗi xuất dữ liệu',
        message: err instanceof Error ? err.message : 'Có lỗi xảy ra',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Leave Couple Handler
  const handleConfirmLeave = async () => {
    if (leaveConfirmText.trim().toUpperCase() !== 'RỜI') {
      return;
    }

    setIsLeaving(true);
    try {
      const res = await fetch('/api/couples/leave', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Rời couple thất bại');
      }

      toast({
        type: 'success',
        title: 'Đã rời không gian chung',
        message: 'Dữ liệu sẽ được lưu trữ 30 ngày trước khi xoá vĩnh viễn.',
      });

      setLeaveStep(0);
      router.push('/dashboard');
    } catch (err: unknown) {
      toast({
        type: 'error',
        title: 'Lỗi',
        message: err instanceof Error ? err.message : 'Có lỗi xảy ra',
      });
    } finally {
      setIsLeaving(false);
    }
  };

  // 3. Delete Account Handler
  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'XOATAIKHOAN') {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'XOATAIKHOAN' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Xoá tài khoản thất bại');
      }

      toast({ type: 'success', title: 'Đã xoá tài khoản thành công' });
      await signOut({ callbackUrl: '/login' });
    } catch (err: unknown) {
      toast({
        type: 'error',
        title: 'Lỗi',
        message: err instanceof Error ? err.message : 'Có lỗi xảy ra',
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Back button */}
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
          <span>📦</span> Dữ liệu của bạn
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Xuất toàn bộ kỷ niệm hoặc quản lý vòng đời tài khoản của bạn.
        </p>
      </header>

      {/* 1. Export Data Section */}
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileArchive size={20} />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-text">Xuất dữ liệu</h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Tải về file ZIP chứa toàn bộ ảnh gốc và file <code>data.json</code> gồm kỷ niệm, địa điểm, tâm trạng, wishlist, câu trả lời hằng ngày và luận giải AI.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleExportData}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-semibold text-xs hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Đang nén dữ liệu ZIP...</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Tải file ZIP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Danger Zone */}
      <div className="bg-surface rounded-[var(--radius-xl)] border border-red-500/20 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <h3 className="font-heading text-base font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>Vùng cần cân nhắc</span>
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Các thao tác dưới đây có thể ảnh hưởng vĩnh viễn đến dữ liệu chung hoặc tài khoản.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          {/* Leave Couple */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface-hover/50 border border-border">
            <div>
              <h4 className="font-semibold text-sm text-text">Rời không gian chung</h4>
              <p className="text-xs text-text-muted mt-0.5">
                Dữ liệu chung sẽ được lưu 30 ngày rồi xoá vĩnh viễn. Bạn có thể xuất dữ liệu trước khi rời.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLeaveStep(1);
                setLeaveConfirmText('');
              }}
              className="px-4 py-2 rounded-lg border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Rời couple
            </button>
          </div>

          {/* Delete Account */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface-hover/50 border border-border">
            <div>
              <h4 className="font-semibold text-sm text-text">Xoá tài khoản</h4>
              <p className="text-xs text-text-muted mt-0.5">
                Xóa toàn bộ dữ liệu cá nhân, gồm ảnh và kết quả AI. Thao tác này không thể hoàn tác.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsDeleteModalOpen(true);
                setDeleteConfirmText('');
              }}
              className="px-4 py-2 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Xoá tài khoản
            </button>
          </div>
        </div>
      </div>

      {/* Leave Couple Modal - Step 1: Explain & Offer Export */}
      {leaveStep === 1 && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-[var(--radius-2xl)] p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={20} />
            </div>
            <div className="text-center">
              <h3 className="font-heading text-lg font-bold text-text">
                Bạn muốn rời không gian chung?
              </h3>
              <p className="text-xs text-text-muted mt-2 leading-relaxed">
                Sau khi rời, cả hai sẽ chuyển sang chế độ chỉ xem và xuất dữ liệu. Sau <strong>30 ngày</strong>, toàn bộ kỷ niệm chung sẽ bị xoá vĩnh viễn khỏi hệ thống.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="w-full py-2.5 px-3 rounded-xl border border-border bg-surface-hover hover:bg-surface text-xs font-semibold text-text flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                <span>Xuất dữ liệu trước</span>
              </button>

              <button
                type="button"
                onClick={() => setLeaveStep(2)}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Tôi hiểu, tiếp tục
              </button>

              <button
                type="button"
                onClick={() => setLeaveStep(0)}
                className="w-full py-2 text-xs font-medium text-text-muted hover:text-text cursor-pointer"
              >
                Huỷ bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Couple Modal - Step 2: Confirm typing RỜI */}
      {leaveStep === 2 && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-[var(--radius-2xl)] p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="text-center">
              <h3 className="font-heading text-lg font-bold text-text">
                Xác nhận rời couple
              </h3>
              <p className="text-xs text-text-muted mt-2">
                Để xác nhận, vui lòng gõ đúng chữ <strong>RỜI</strong> vào ô bên dưới:
              </p>
            </div>

            <input
              type="text"
              value={leaveConfirmText}
              onChange={(e) => setLeaveConfirmText(e.target.value)}
              placeholder="Gõ RỜI để xác nhận"
              className="w-full text-center py-2 text-sm rounded-xl border border-border bg-background text-text focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 uppercase font-bold"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLeaveStep(0)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-surface-hover text-text-muted hover:text-text cursor-pointer"
              >
                Huỷ
              </button>
              <button
                type="button"
                disabled={leaveConfirmText.trim().toUpperCase() !== 'RỜI' || isLeaving}
                onClick={handleConfirmLeave}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1"
              >
                {isLeaving && <Loader2 size={13} className="animate-spin" />}
                <span>Xác nhận</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-[var(--radius-2xl)] p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 size={20} />
            </div>
            <div className="text-center">
              <h3 className="font-heading text-lg font-bold text-text">
                Xoá tài khoản vĩnh viễn
              </h3>
              <p className="text-xs text-text-muted mt-2 leading-relaxed">
                Toàn bộ dữ liệu cá nhân, ảnh đại diện và kết quả AI sẽ bị xoá vĩnh viễn. Vui lòng gõ <strong>XOATAIKHOAN</strong> để xác nhận:
              </p>
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Gõ XOATAIKHOAN"
              className="w-full text-center py-2 text-sm rounded-xl border border-border bg-background text-text focus:outline-hidden focus:ring-2 focus:ring-red-500/20 font-bold"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-surface-hover text-text-muted hover:text-text cursor-pointer"
              >
                Huỷ
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim() !== 'XOATAIKHOAN' || isDeleting}
                onClick={handleConfirmDeleteAccount}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1"
              >
                {isDeleting && <Loader2 size={13} className="animate-spin" />}
                <span>Xác nhận xoá</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
