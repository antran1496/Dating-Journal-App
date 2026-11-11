import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hashPin,
  setupPin,
  verifyPin,
  disableLock,
  isLockEnabled,
  isCurrentlyLocked,
  lockApp,
  unlockApp,
  resetFailedAttempts,
  recordFailedAttempt,
  checkAutoLock,
} from './lock';

describe('lib/security/lock', () => {
  const storageMap = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => storageMap.get(k) ?? null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
    clear: () => storageMap.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;

  beforeEach(() => {
    storageMap.clear();
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: mockStorage, sessionStorage: mockStorage },
      writable: true,
      configurable: true,
    });
    resetFailedAttempts();
    vi.restoreAllMocks();
  });

  it('hashes pin consistently with same salt and differently with distinct pin', async () => {
    const salt = 'abcdef1234567890';
    const hash1 = await hashPin('1234', salt);
    const hash2 = await hashPin('1234', salt);
    const hashDiff = await hashPin('4321', salt);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashDiff);
    expect(hash1.length).toBe(64); // SHA-256 hex string length
  });

  it('sets up PIN, verifies correctly, and unlocks', async () => {
    await setupPin('9876');

    expect(isLockEnabled()).toBe(true);
    expect(isCurrentlyLocked()).toBe(false);

    lockApp();
    expect(isCurrentlyLocked()).toBe(true);

    // Incorrect PIN
    const failRes = await verifyPin('1111');
    expect(failRes.success).toBe(false);
    expect(isCurrentlyLocked()).toBe(true);

    // Correct PIN
    const successRes = await verifyPin('9876');
    expect(successRes.success).toBe(true);
    expect(isCurrentlyLocked()).toBe(false);
  });

  it('disables lock and removes credentials', async () => {
    await setupPin('1234');
    expect(isLockEnabled()).toBe(true);

    disableLock();
    expect(isLockEnabled()).toBe(false);
    expect(isCurrentlyLocked()).toBe(false);
  });

  it('locks temporarily on 5 failed attempts and triggers force logout on 10', () => {
    // 1-4 fails
    for (let i = 1; i <= 4; i++) {
      const res = recordFailedAttempt();
      expect(res.attempts).toBe(i);
      expect(res.lockedUntil).toBeNull();
      expect(res.forceLogout).toBe(false);
    }

    // 5th fail -> locks temporarily
    const fifth = recordFailedAttempt();
    expect(fifth.attempts).toBe(5);
    expect(fifth.lockedUntil).toBeGreaterThan(Date.now());
    expect(fifth.forceLogout).toBe(false);

    // 6th to 9th
    for (let i = 6; i <= 9; i++) {
      const res = recordFailedAttempt();
      expect(res.attempts).toBe(i);
      expect(res.lockedUntil).toBeGreaterThan(Date.now());
      expect(res.forceLogout).toBe(false);
    }

    // 10th fail -> force logout
    const tenth = recordFailedAttempt();
    expect(tenth.forceLogout).toBe(true);
  });

  it('triggers auto-lock when background elapsed time exceeds 60 seconds', async () => {
    await setupPin('5555');
    unlockApp();
    expect(isCurrentlyLocked()).toBe(false);

    // Record hidden at 65 seconds ago
    const past = Date.now() - 65 * 1000;
    localStorage.setItem('dj_lock_hidden_at', String(past));

    const didLock = checkAutoLock();
    expect(didLock).toBe(true);
    expect(isCurrentlyLocked()).toBe(true);
  });

  it('does not trigger auto-lock when background elapsed time is under 60 seconds', async () => {
    await setupPin('5555');
    unlockApp();

    // Record hidden at 20 seconds ago
    const past = Date.now() - 20 * 1000;
    localStorage.setItem('dj_lock_hidden_at', String(past));

    const didLock = checkAutoLock();
    expect(didLock).toBe(false);
    expect(isCurrentlyLocked()).toBe(false);
  });
});
