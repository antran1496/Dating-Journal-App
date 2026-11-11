'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Lock,
  Check,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import {
  isLockEnabled,
  setupPin,
  disableLock,
  lockApp,
  getLockTimeout,
  setLockTimeout,
} from '@/lib/security/lock';
import { useToast } from '@/components/ui/toast';

export default function PrivacySettingsPage() {
  const { toast } = useToast();
  const [lockOn, setLockOn] = useState(false);
  const [timeoutSetting, setTimeoutSetting] = useState<'immediate' | '1m' | '5m'>('1m');

  // PIN Setup Modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinStep, setPinStep] = useState<1 | 2>(1);
  const [firstPin, setFirstPin] = useState('');
  const [secondPin, setSecondPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLockOn(isLockEnabled());
    setTimeoutSetting(getLockTimeout());
  }, []);

  useEffect(() => {
    if (isPinModalOpen) {
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
    }
  }, [isPinModalOpen, pinStep]);

  const handleToggleLock = () => {
    if (lockOn) {
      disableLock();
      setLockOn(false);
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
                Bảo vệ bằng mã PIN 4 số khi mở lại ứng dụng hoặc sau thời gian chờ.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={lockOn}
            onClick={handleToggleLock}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 shrink-0 cursor-pointer flex items-center ${
              lockOn ? 'bg-primary' : 'bg-surface-hover border border-border'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 pointer-events-none ${
                lockOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {lockOn && (
          <div className="pt-3 border-t border-border space-y-3.5">
            {/* Test Lock Button */}
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-text font-medium block">Khoá thử ngay</span>
                <span className="text-[11px] text-text-muted">Khoá màn hình ngay lập tức để thử mở bằng mã PIN</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  lockApp();
                  window.location.reload();
                }}
                className="px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-primary/10 text-primary font-semibold border border-border hover:border-primary/30 transition-colors cursor-pointer shrink-0"
              >
                Khoá ngay
              </button>
            </div>

            {/* Timeout selector */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-text font-medium">Tự động khoá</span>
              <select
                value={timeoutSetting}
                onChange={(e) => {
                  const val = e.target.value as 'immediate' | '1m' | '5m';
                  setTimeoutSetting(val);
                  setLockTimeout(val);
                  toast({ type: 'success', title: 'Đã lưu thời gian tự động khoá' });
                }}
                className="px-2.5 py-1 rounded-lg bg-surface border border-border text-text text-xs focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="immediate">Ngay khi rời app</option>
                <option value="1m">Sau 1 phút</option>
                <option value="5m">Sau 5 phút</option>
              </select>
            </div>

            {/* Change PIN button */}
            <div className="flex items-center justify-between text-xs pt-1">
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
          </div>
        )}
      </div>

      {/* 2. Who Sees What Table */}
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

      {/* PIN Setup Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-[var(--radius-2xl)] p-6 max-w-sm w-full space-y-5 shadow-2xl animate-scaleUp">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <Lock size={22} />
              </div>
              <h3 className="font-heading text-lg font-bold text-text">
                {pinStep === 1 ? 'Đặt mã PIN mới' : 'Xác nhận lại mã PIN'}
              </h3>
              <p className="text-xs text-text-muted mt-1">
                {pinStep === 1
                  ? 'Nhập 4 chữ số bảo vệ ứng dụng'
                  : 'Nhập lại 4 chữ số vừa chọn để xác nhận'}
              </p>
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 text-center font-medium">
                {pinError}
              </div>
            )}

            {/* 4 PIN Dots visual display */}
            <div className="flex justify-center gap-3 py-1">
              {[0, 1, 2, 3].map((idx) => {
                const currentDigits = pinStep === 1 ? firstPin : secondPin;
                const isFilled = currentDigits.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-all border ${
                      isFilled
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-border bg-surface text-transparent'
                    }`}
                  >
                    {isFilled ? '●' : ''}
                  </div>
                );
              })}
            </div>

            {/* Number-Only Input with numeric keypad on mobile */}
            <div className="flex justify-center">
              <input
                ref={pinInputRef}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pinStep === 1 ? firstPin : secondPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  if (pinStep === 1) {
                    setFirstPin(val);
                    setPinError(null);
                    if (val.length === 4) {
                      setTimeout(() => {
                        setPinStep(2);
                        setPinError(null);
                      }, 200);
                    }
                  } else {
                    setSecondPin(val);
                    setPinError(null);
                  }
                }}
                autoFocus
                className="w-full text-center text-sm py-2.5 rounded-xl border border-border bg-surface-hover text-text tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Nhập 4 chữ số..."
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (pinStep === 2) {
                    setPinStep(1);
                    setSecondPin('');
                    setPinError(null);
                  } else {
                    setIsPinModalOpen(false);
                  }
                }}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-surface-hover text-text-muted hover:text-text cursor-pointer transition-colors"
              >
                {pinStep === 2 ? 'Quay lại' : 'Huỷ'}
              </button>

              {pinStep === 2 ? (
                <button
                  type="button"
                  disabled={secondPin.length < 4}
                  onClick={handleSavePin}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-primary text-white hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 transition-opacity shadow-sm"
                >
                  <Check size={14} />
                  <span>Xác nhận</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={firstPin.length < 4}
                  onClick={() => {
                    if (firstPin.length === 4) {
                      setPinStep(2);
                      setPinError(null);
                    }
                  }}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-primary text-white hover:opacity-90 disabled:opacity-50 cursor-pointer transition-opacity shadow-sm"
                >
                  Tiếp tục
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
