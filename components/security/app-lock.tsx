'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import {
  Lock,
  Delete,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  isCurrentlyLocked,
  verifyPin,
  getLockedUntil,
  recordHiddenAt,
  checkAutoLock,
} from '@/lib/security/lock';

interface AppLockProviderProps {
  children: React.ReactNode;
}

export function AppLockProvider({ children }: AppLockProviderProps) {
  const [locked, setLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [remainingCooldown, setRemainingCooldown] = useState<number | null>(null);

  // Check initial lock state on mount
  useEffect(() => {
    if (isCurrentlyLocked() || checkAutoLock()) {
      setLocked(true);
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    const lockedUntil = getLockedUntil();
    if (!lockedUntil) {
      setRemainingCooldown(null);
      return;
    }

    const interval = setInterval(() => {
      const diff = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (diff <= 0) {
        setRemainingCooldown(null);
        setErrorMsg(null);
        clearInterval(interval);
      } else {
        setRemainingCooldown(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [locked]);

  // Handle auto-lock when visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        recordHiddenAt();
      } else {
        if (checkAutoLock() || isCurrentlyLocked()) {
          setLocked(true);
          setPinInput('');
          setErrorMsg(null);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleVisibilityChange);
    };
  }, []);

  // Handle PIN submission
  const handleSubmitPin = useCallback(async (pinToVerify: string) => {
    const res = await verifyPin(pinToVerify);

    if (res.success) {
      setLocked(false);
      setPinInput('');
      setErrorMsg(null);
      setRemainingCooldown(null);
    } else {
      setPinInput('');
      if (res.forceLogout) {
        signOut({ callbackUrl: '/login' });
      } else if (res.lockedUntil) {
        const diff = Math.ceil((res.lockedUntil - Date.now()) / 1000);
        setRemainingCooldown(diff);
        setErrorMsg(`Đã nhập sai quá nhiều lần. Vui lòng thử lại sau ${diff}s.`);
      } else {
        setErrorMsg('Mã PIN không đúng. Vui lòng thử lại.');
      }
    }
  }, []);

  const handleKeyPress = useCallback((num: string) => {
    if (remainingCooldown) return;
    if (pinInput.length >= 4) return;

    const next = pinInput + num;
    setPinInput(next);
    setErrorMsg(null);

    // Auto submit if 4 digits
    if (next.length === 4) {
      handleSubmitPin(next);
    }
  }, [pinInput, remainingCooldown, handleSubmitPin]);

  const handleDelete = useCallback(() => {
    if (remainingCooldown) return;
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  }, [remainingCooldown]);

  // Support hardware/virtual keyboard typing when locked
  useEffect(() => {
    if (!locked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [locked, handleKeyPress, handleDelete]);

  // Render locked screen when locked
  if (locked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 select-none animate-fadeIn">
        <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-sm">
            <Lock size={32} />
          </div>

          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-text">
              Nhập mã để mở app
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-1">
              Dating Journal đã được khoá để bảo vệ kỷ niệm
            </p>
          </div>

          {/* PIN Dots */}
          <div className="flex items-center gap-4 my-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  pinInput.length > idx
                    ? 'bg-primary scale-110 shadow-xs'
                    : 'border-2 border-border bg-surface'
                }`}
              />
            ))}
          </div>

          {/* Error / Timeout banner */}
          {remainingCooldown ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-full">
              <ShieldAlert size={14} />
              <span>Thử lại sau {remainingCooldown} giây</span>
            </div>
          ) : errorMsg ? (
            <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-full">
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          ) : null}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                disabled={!!remainingCooldown}
                onClick={() => handleKeyPress(String(n))}
                className="w-16 h-16 rounded-full bg-surface hover:bg-surface-hover active:scale-95 text-lg font-bold text-text transition-all border border-border shadow-2xs flex items-center justify-center mx-auto cursor-pointer disabled:opacity-40"
              >
                {n}
              </button>
            ))}

            {/* Bottom Row */}
            <div className="flex items-center justify-center" />

            <button
              type="button"
              disabled={!!remainingCooldown}
              onClick={() => handleKeyPress('0')}
              className="w-16 h-16 rounded-full bg-surface hover:bg-surface-hover active:scale-95 text-lg font-bold text-text transition-all border border-border shadow-2xs flex items-center justify-center mx-auto cursor-pointer disabled:opacity-40"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="w-16 h-16 rounded-full text-text-muted hover:text-text hover:bg-surface-hover flex items-center justify-center transition-all cursor-pointer"
              aria-label="Xoá ký tự"
            >
              <Delete size={22} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
