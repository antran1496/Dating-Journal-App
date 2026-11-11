/**
 * App Lock & Privacy security utilities (Client-side)
 * Uses Web Crypto API for zero-dependency SHA-256 PIN hashing with salt.
 */

const STORAGE_KEYS = {
  ENABLED: 'dj_lock_enabled',
  HASH: 'dj_lock_hash',
  SALT: 'dj_lock_salt',
  FAILED: 'dj_lock_failed_attempts',
  LOCKED_UNTIL: 'dj_lock_locked_until',
  HIDDEN_AT: 'dj_lock_hidden_at',
  STATUS: 'dj_lock_status', // 'locked' | 'unlocked'
  TIMEOUT: 'dj_lock_timeout', // 'immediate' | '1m' | '5m'
};

const SESSION_UNLOCKED_KEY = 'dj_session_unlocked';

export async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

export function isLockEnabled(): boolean {
  const storage = getStorage();
  return storage?.getItem(STORAGE_KEYS.ENABLED) === 'true';
}

export function hasPin(): boolean {
  const storage = getStorage();
  return !!storage?.getItem(STORAGE_KEYS.HASH);
}

export async function setupPin(pin: string): Promise<void> {
  const storage = getStorage();
  if (!storage) return;

  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const hash = await hashPin(pin, salt);
  storage.setItem(STORAGE_KEYS.SALT, salt);
  storage.setItem(STORAGE_KEYS.HASH, hash);
  storage.setItem(STORAGE_KEYS.ENABLED, 'true');
  storage.setItem(STORAGE_KEYS.STATUS, 'unlocked');
  getSessionStorage()?.setItem(SESSION_UNLOCKED_KEY, 'true');
  resetFailedAttempts();
}

export function disableLock(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(STORAGE_KEYS.ENABLED);
  storage.removeItem(STORAGE_KEYS.HASH);
  storage.removeItem(STORAGE_KEYS.SALT);
  storage.removeItem(STORAGE_KEYS.STATUS);
  storage.removeItem(STORAGE_KEYS.TIMEOUT);
  getSessionStorage()?.removeItem(SESSION_UNLOCKED_KEY);
  resetFailedAttempts();
}

export function isCurrentlyLocked(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isLockEnabled()) return false;
  const localStatus = getStorage()?.getItem(STORAGE_KEYS.STATUS);
  if (localStatus === 'locked') return true;
  const sessionUnlocked = getSessionStorage()?.getItem(SESSION_UNLOCKED_KEY) === 'true';
  return !sessionUnlocked;
}

export function lockApp(): void {
  const storage = getStorage();
  if (!storage || !isLockEnabled()) return;
  storage.setItem(STORAGE_KEYS.STATUS, 'locked');
  getSessionStorage()?.removeItem(SESSION_UNLOCKED_KEY);
}

export function unlockApp(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEYS.STATUS, 'unlocked');
  getSessionStorage()?.setItem(SESSION_UNLOCKED_KEY, 'true');
  resetFailedAttempts();
}

export function getLockTimeout(): 'immediate' | '1m' | '5m' {
  const storage = getStorage();
  const val = storage?.getItem(STORAGE_KEYS.TIMEOUT);
  if (val === 'immediate' || val === '5m') return val;
  return '1m';
}

export function setLockTimeout(timeout: 'immediate' | '1m' | '5m'): void {
  const storage = getStorage();
  storage?.setItem(STORAGE_KEYS.TIMEOUT, timeout);
}

export function getFailedAttempts(): number {
  const storage = getStorage();
  if (!storage) return 0;
  return parseInt(storage.getItem(STORAGE_KEYS.FAILED) || '0', 10);
}

export function getLockedUntil(): number | null {
  const storage = getStorage();
  if (!storage) return null;
  const val = storage.getItem(STORAGE_KEYS.LOCKED_UNTIL);
  if (!val) return null;
  const num = parseInt(val, 10);
  return num > Date.now() ? num : null;
}

export function resetFailedAttempts(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(STORAGE_KEYS.FAILED);
  storage.removeItem(STORAGE_KEYS.LOCKED_UNTIL);
}

export function recordFailedAttempt(): {
  attempts: number;
  lockedUntil: number | null;
  forceLogout: boolean;
} {
  const storage = getStorage();
  if (!storage) return { attempts: 0, lockedUntil: null, forceLogout: false };

  const current = getFailedAttempts() + 1;
  storage.setItem(STORAGE_KEYS.FAILED, String(current));

  if (current >= 10) {
    resetFailedAttempts();
    return { attempts: current, lockedUntil: null, forceLogout: true };
  }

  if (current >= 5) {
    const timeoutSeconds = 30 * (current - 4);
    const lockedUntil = Date.now() + timeoutSeconds * 1000;
    storage.setItem(STORAGE_KEYS.LOCKED_UNTIL, String(lockedUntil));
    return { attempts: current, lockedUntil, forceLogout: false };
  }

  return { attempts: current, lockedUntil: null, forceLogout: false };
}

export async function verifyPin(pin: string): Promise<{
  success: boolean;
  lockedUntil: number | null;
  forceLogout: boolean;
}> {
  const lockedUntil = getLockedUntil();
  if (lockedUntil) {
    return { success: false, lockedUntil, forceLogout: false };
  }

  const storage = getStorage();
  if (!storage) return { success: false, lockedUntil: null, forceLogout: false };

  const salt = storage.getItem(STORAGE_KEYS.SALT);
  const storedHash = storage.getItem(STORAGE_KEYS.HASH);

  if (!salt || !storedHash) {
    return { success: false, lockedUntil: null, forceLogout: false };
  }

  const hash = await hashPin(pin, salt);
  if (hash === storedHash) {
    unlockApp();
    return { success: true, lockedUntil: null, forceLogout: false };
  }

  const failRes = recordFailedAttempt();
  return {
    success: false,
    lockedUntil: failRes.lockedUntil,
    forceLogout: failRes.forceLogout,
  };
}

export function recordHiddenAt(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEYS.HIDDEN_AT, String(Date.now()));
}

export function checkAutoLock(): boolean {
  if (!isLockEnabled()) return false;
  const storage = getStorage();
  if (!storage) return false;

  const hiddenAtStr = storage.getItem(STORAGE_KEYS.HIDDEN_AT);
  if (!hiddenAtStr) return false;

  const hiddenAt = parseInt(hiddenAtStr, 10);
  const elapsed = Date.now() - hiddenAt;
  const timeoutSetting = getLockTimeout();
  const timeoutMs =
    timeoutSetting === 'immediate'
      ? 1500
      : timeoutSetting === '5m'
        ? 5 * 60 * 1000
        : 60 * 1000;

  if (elapsed >= timeoutMs) {
    lockApp();
    storage.removeItem(STORAGE_KEYS.HIDDEN_AT);
    return true;
  }

  return false;
}
