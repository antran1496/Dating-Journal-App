/**
 * App Lock & Privacy security utilities (Client-side)
 * Uses Web Crypto API for zero-dependency SHA-256 PIN hashing with salt.
 */

const STORAGE_KEYS = {
  ENABLED: 'dj_lock_enabled',
  HASH: 'dj_lock_hash',
  SALT: 'dj_lock_salt',
  BIOMETRICS: 'dj_lock_biometrics',
  FAILED: 'dj_lock_failed_attempts',
  LOCKED_UNTIL: 'dj_lock_locked_until',
  HIDDEN_AT: 'dj_lock_hidden_at',
  STATUS: 'dj_lock_status', // 'locked' | 'unlocked'
  MULTITASK_BLUR: 'dj_privacy_blur_enabled',
};

const AUTO_LOCK_TIMEOUT_MS = 60 * 1000; // 1 minute in background

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
  resetFailedAttempts();
}

export function disableLock(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(STORAGE_KEYS.ENABLED);
  storage.removeItem(STORAGE_KEYS.HASH);
  storage.removeItem(STORAGE_KEYS.SALT);
  storage.removeItem(STORAGE_KEYS.BIOMETRICS);
  storage.removeItem(STORAGE_KEYS.STATUS);
  resetFailedAttempts();
}

export function isCurrentlyLocked(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  if (!isLockEnabled()) return false;
  const status = storage.getItem(STORAGE_KEYS.STATUS);
  return status !== 'unlocked';
}

export function lockApp(): void {
  const storage = getStorage();
  if (!storage || !isLockEnabled()) return;
  storage.setItem(STORAGE_KEYS.STATUS, 'locked');
}

export function unlockApp(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEYS.STATUS, 'unlocked');
  resetFailedAttempts();
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
    // 10 failed attempts -> force logout
    resetFailedAttempts();
    return { attempts: current, lockedUntil: null, forceLogout: true };
  }

  if (current >= 5) {
    // 5-9 failed attempts -> 30s timeout (increases with each subsequent fail)
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

  if (elapsed >= AUTO_LOCK_TIMEOUT_MS) {
    lockApp();
    storage.removeItem(STORAGE_KEYS.HIDDEN_AT);
    return true;
  }

  return false;
}

export function isBiometricsEnabled(): boolean {
  const storage = getStorage();
  return storage?.getItem(STORAGE_KEYS.BIOMETRICS) === 'true';
}

export function setBiometricsEnabled(enabled: boolean): void {
  const storage = getStorage();
  if (!storage) return;
  if (enabled) {
    storage.setItem(STORAGE_KEYS.BIOMETRICS, 'true');
  } else {
    storage.removeItem(STORAGE_KEYS.BIOMETRICS);
  }
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function isMultitaskBlurEnabled(): boolean {
  const storage = getStorage();
  return storage?.getItem(STORAGE_KEYS.MULTITASK_BLUR) === 'true';
}

export function setMultitaskBlurEnabled(enabled: boolean): void {
  const storage = getStorage();
  if (!storage) return;
  if (enabled) {
    storage.setItem(STORAGE_KEYS.MULTITASK_BLUR, 'true');
  } else {
    storage.removeItem(STORAGE_KEYS.MULTITASK_BLUR);
  }
}
