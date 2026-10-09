'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  EyeOff,
  Fingerprint,
  Check,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';
import {
  isLockEnabled,
  setupPin,
  disableLock,
  isBiometricsEnabled,
  setBiometricsEnabled,
  isPlatformAuthenticatorAvailable,
  isMultitaskBlurEnabled,
  setMultitaskBlurEnabled,
} from '@/lib/security/lock';
import { useToast } from '@/components/ui/toast';

export default function PrivacySettingsPage() {
  const { toast } = useToast();
  const [lockOn, setLockOn] = useState(false);
  const [biometricsOn, setBiometricsOn] = useState(false);
  const [hasBioHardware, setHasBioHardware] = useState(false);
  const [multitaskBlurOn, setMultitaskBlurOn] = useState(false);

  // PIN Setup Modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinStep, setPinStep] = useState<1 | 2>(1);
  const [firstPin, setFirstPin] = useState('');
  const [secondPin, setSecondPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    setLockOn(isLockEnabled());
    setBiometricsOn(isBiometricsEnabled());
    setMultitaskBlurOn(isMultitaskBlurEnabled());

    isPlatformAuthenticatorAvailable().then((avail) => {
      setHasBioHardware(avail);
    });
  }, []);

  const handleToggleLock = () => {
    if (lockOn) {
      disableLock();
      setLockOn(false);
      setBiometricsOn(false);
      toast({ type: 'success', title: 'Đã tắt khoá ứng dụng' });
    } else {
      // Open PIN modal
      setFirstPin('');
      setSecondPin('');
      setPinStep(1);
      setPinError(null);
      setIsPinModalOpen(true);
    }
  };

  const handleSavePin = async () => {
    if (firstPin !== secondPin) {
      setPinError('Mã PIN nhập lại không khớp. Vui lòng thử lại.');
      setSecondPin('');
      setPinStep(1);
      setFirstPin('');
      return;
    }

    await setupPin(firstPin);
    setLockOn(true);
    setIsPinModalOpen(false);
    toast({ type: 'success', title: 'Đã thiết lập mã PIN thành công' });
  };

  const handleToggleBiometrics = () => {
    const next = !biometricsOn;
    setBiometricsEnabled(next);
    setBiometricsOn(next);
    toast({
      type: 'success',
      title: next
        ? 'Đã bật mở khoá bằng sinh trắc học'
        : 'Đã tắt mở khoá bằng sinh trắc học',
    });
  };

  const handleToggleMultitaskBlur = () => {
    const next = !multitaskBlurOn;
    setMultitaskBlurEnabled(next);
    setMultitaskBlurOn(next);
    toast({
      type: 'success',
      title: next
        ? 'Đã bật làm mờ app khi chuyển màn hình'
        : 'Đã tắt làm mờ app',
    });
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
          <span>🛡️</span> Riêng tư & bảo mật
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Bảo vệ kỷ niệm và kiểm soát quyền riêng tư của bạn và người ấy.
        </p>
      </header>

      {/* 1. App Lock Card */}
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-text">Khoá ứng dụng</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Tự động khoá sau 1 phút ở chế độ nền. Yêu cầu mã PIN 4 số để mở.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleLock}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              lockOn ? 'bg-primary' : 'bg-surface-hover border border-border'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs absolute top-0.5 ${
                lockOn ? 'left-5.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {lockOn && (
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text font-medium">Đổi mã PIN</span>
              <button
                type="button"
                onClick={() => {
                  setFirstPin('');
                  setSecondPin('');
                  setPinStep(1);
                  setPinError(null);
                  setIsPinModalOpen(true);
                }}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                Thay đổi
              </button>
            </div>

            {hasBioHardware && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-text font-medium flex items-center gap-1.5">
                  <Fingerprint size={15} className="text-primary" />
                  <span>Mở khoá bằng sinh trắc học (Face ID / Vân tay)</span>
                </span>
                <button
                  type="button"
                  onClick={handleToggleBiometrics}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    biometricsOn ? 'bg-primary' : 'bg-surface-hover border border-border'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform shadow-xs absolute top-0.5 ${
                      biometricsOn ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Multitask Blur Card */}
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <EyeOff size={18} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-text">Ẩn đa nhiệm</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Làm mờ nội dung ứng dụng khi bạn chuyển qua app khác để người xung quanh không nhìn thấy.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleMultitaskBlur}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              multitaskBlurOn ? 'bg-primary' : 'bg-surface-hover border border-border'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs absolute top-0.5 ${
                multitaskBlurOn ? 'left-5.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Media Link Expiration Notice */}
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
          <ImageIcon size={18} />
        </div>
        <div>
          <h3 className="font-heading text-base font-bold text-text">Đường dẫn ảnh có hạn</h3>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Ảnh và video chỉ mở qua đường dẫn có thời hạn bảo mật. Người ngoài không xem được dù có liên kết, đảm bảo mọi kỷ niệm luôn hoàn toàn riêng tư.
          </p>
        </div>
      </div>

      {/* 4. Who Sees What Table */}
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs space-y-3">
        <h3 className="font-heading text-base font-bold text-text flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          <span>Ai xem được gì</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Loại dữ liệu</th>
                <th className="py-2.5 px-3">Ai có quyền xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="py-3 px-3 font-medium text-text">Kỷ niệm & ảnh</td>
                <td className="py-3 px-3 text-primary font-medium">Chỉ hai bạn</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-text">Tin nhắn Cupid</td>
                <td className="py-3 px-3 text-primary font-medium">Chỉ hai bạn</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-text">Luận giải AI cá nhân</td>
                <td className="py-3 px-3 text-text-muted">
                  Mặc định chỉ bạn (cho đến khi bạn chọn chia sẻ)
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-text">Thông tin tài khoản</td>
                <td className="py-3 px-3 text-text-muted">Chỉ bạn và hệ thống bảo mật</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Link to Data & Account lifecycle */}
      <div className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-heading text-sm font-bold text-text">Dữ liệu & Vòng đời tài khoản</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Xuất dữ liệu ZIP, rời không gian chung, hoặc xoá tài khoản.
          </p>
        </div>
        <Link
          href="/settings/data"
          className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
        >
          <span>Quản lý</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* PIN Setup Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-[var(--radius-2xl)] p-6 max-w-sm w-full space-y-5 shadow-2xl animate-scaleUp">
            <div className="text-center">
              <h3 className="font-heading text-lg font-bold text-text">
                {pinStep === 1 ? 'Đặt mã PIN mới' : 'Xác nhận lại mã PIN'}
              </h3>
              <p className="text-xs text-text-muted mt-1">
                {pinStep === 1
                  ? 'Nhập 4 chữ số để tạo mã khoá ứng dụng'
                  : 'Nhập lại 4 chữ số vừa chọn để xác nhận'}
              </p>
            </div>

            {pinError && (
              <p className="text-xs text-red-500 text-center font-medium">{pinError}</p>
            )}

            <div className="flex justify-center gap-3">
              <input
                type="password"
                maxLength={4}
                value={pinStep === 1 ? firstPin : secondPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  if (pinStep === 1) {
                    setFirstPin(val);
                    if (val.length === 4) {
                      setPinStep(2);
                      setPinError(null);
                    }
                  } else {
                    setSecondPin(val);
                  }
                }}
                autoFocus
                placeholder="••••"
                className="w-36 text-center text-2xl tracking-widest py-2 rounded-xl border border-border bg-background text-text focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-surface-hover text-text-muted hover:text-text cursor-pointer"
              >
                Huỷ
              </button>
              {pinStep === 2 && (
                <button
                  type="button"
                  disabled={secondPin.length < 4}
                  onClick={handleSavePin}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-primary text-white hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Check size={14} />
                  <span>Hoàn tất</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
