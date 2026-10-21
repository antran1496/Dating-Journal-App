/**
 * Offline Drafts management using IndexedDB for Dating Journal v2.
 * Stores pending date entries when network is weak or offline,
 * and synchronizes them idempotently when connection is restored.
 */

import type { DateFormValues, DatePlaceInput, DateMediaInput } from '@/types/forms';
import type { DateEntry } from '@/types';

export interface DraftMediaItem {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  kind: 'image' | 'video';
  width?: number;
  height?: number;
  duration_s?: number;
}

export interface OfflineDraft {
  id: string; // client_id (UUID)
  couple_id: string;
  form: DateFormValues;
  places: DatePlaceInput[];
  mediaFiles: DraftMediaItem[];
  uploadedMedia: DateMediaInput[];
  createdAt: number;
  updatedAt: number;
  status: 'pending' | 'syncing' | 'failed';
  lastError?: string;
}

const DB_NAME = 'dating_journal_offline';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB không được hỗ trợ trong môi trường này'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('couple_id', 'couple_id', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDraft(draft: OfflineDraft): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const putRequest = store.put({
      ...draft,
      updatedAt: Date.now(),
    });

    putRequest.onsuccess = () => resolve();
    putRequest.onerror = () => reject(putRequest.error);
  });
}

export async function getAllDrafts(): Promise<OfflineDraft[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as OfflineDraft[]) || [];
        results.sort((a, b) => b.createdAt - a.createdAt);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function getDraft(id: string): Promise<OfflineDraft | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve((request.result as OfflineDraft) || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function getDrafts(coupleId: string): Promise<OfflineDraft[]> {
  try {
    const all = await getAllDrafts();
    // Return drafts for this couple OR orphaned drafts saved with placeholder ids
    return all.filter(
      (d) =>
        d.couple_id === coupleId ||
        !d.couple_id ||
        d.couple_id === 'temp-couple' ||
        d.couple_id === 'unknown'
    );
  } catch {
    return [];
  }
}

export async function deleteDraft(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Graceful fallback
  }
}

export async function clearAllDrafts(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Uploads media files in a draft and posts the date to /api/dates.
 */
export async function syncDraft(
  draft: OfflineDraft,
  activeCoupleId?: string
): Promise<{ ok: boolean; date?: DateEntry; error?: string }> {
  try {
    const targetCoupleId =
      activeCoupleId && /^[0-9a-f-]{36}$/i.test(activeCoupleId)
        ? activeCoupleId
        : draft.couple_id;

    if (!targetCoupleId || !/^[0-9a-f-]{36}$/i.test(targetCoupleId)) {
      throw new Error('Chưa có mã cặp đôi (couple_id) hợp lệ để đồng bộ');
    }

    // Ensure draft has valid UUID client_id
    const clientId =
      draft.id && /^[0-9a-f-]{36}$/i.test(draft.id) ? draft.id : crypto.randomUUID();

    await saveDraft({ ...draft, couple_id: targetCoupleId, status: 'syncing' });

    const uploadedMedia: DateMediaInput[] = [...(draft.uploadedMedia || [])];

    // Upload any pending media blobs
    for (const media of draft.mediaFiles || []) {
      // Check if already uploaded
      if (uploadedMedia.some((u) => u.position === Number(media.id))) {
        continue;
      }

      const file = new File([media.blob], media.name, { type: media.type });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', media.kind);
      formData.append('couple_id', targetCoupleId);
      if (media.width) formData.append('width', String(media.width));
      if (media.height) formData.append('height', String(media.height));
      if (media.duration_s) formData.append('duration_s', String(media.duration_s));

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const json = await uploadRes.json().catch(() => ({}));
        throw new Error(json.error || `Tải tệp "${media.name}" thất bại`);
      }

      const uploadJson = await uploadRes.json();
      const uploadedItem = uploadJson.data;

      uploadedMedia.push({
        path: uploadedItem.path,
        thumb_path: uploadedItem.thumb_path || null,
        kind: uploadedItem.kind,
        width: uploadedItem.width || null,
        height: uploadedItem.height || null,
        duration_s: uploadedItem.duration_s || null,
        bytes: uploadedItem.bytes || null,
        position: uploadedMedia.length,
      });
    }

    const validPlaces = (draft.places || []).filter((p) => p.name && p.name.trim().length > 0);

    // Post to /api/dates
    const postPayload = {
      ...draft.form,
      couple_id: targetCoupleId,
      client_id: clientId,
      places: validPlaces.length > 0 ? validPlaces : undefined,
      media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
    };

    const res = await fetch('/api/dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postPayload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      let errMsg = json.error || 'Lưu buổi hẹn thất bại';
      if (json.details?.fieldErrors) {
        const details = Object.entries(json.details.fieldErrors)
          .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
          .join('; ');
        errMsg = `${errMsg} (${details})`;
      }
      throw new Error(errMsg);
    }

    const json = await res.json();
    const createdDate = json.data as DateEntry;

    // Success -> remove from drafts
    await deleteDraft(draft.id);

    return { ok: true, date: createdDate };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi đồng bộ nháp';
    await saveDraft({ ...draft, status: 'failed', lastError: errorMsg });
    return { ok: false, error: errorMsg };
  }
}
