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

export async function getDrafts(coupleId: string): Promise<OfflineDraft[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('couple_id');
      const request = index.getAll(coupleId);

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

/**
 * Uploads media files in a draft and posts the date to /api/dates.
 */
export async function syncDraft(draft: OfflineDraft): Promise<{ ok: boolean; date?: DateEntry; error?: string }> {
  try {
    await saveDraft({ ...draft, status: 'syncing' });

    const uploadedMedia: DateMediaInput[] = [...draft.uploadedMedia];

    // Upload any pending media blobs
    for (const media of draft.mediaFiles) {
      // Check if already uploaded
      if (uploadedMedia.some((u) => u.position === Number(media.id))) {
        continue;
      }

      const file = new File([media.blob], media.name, { type: media.type });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', media.kind);
      formData.append('couple_id', draft.couple_id);
      if (media.width) formData.append('width', String(media.width));
      if (media.height) formData.append('height', String(media.height));
      if (media.duration_s) formData.append('duration_s', String(media.duration_s));

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const json = await uploadRes.json().catch(() => ({}));
        throw new Error(json.error || 'Tải ảnh/video lên thất bại');
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

    // Post to /api/dates
    const postPayload = {
      ...draft.form,
      couple_id: draft.couple_id,
      client_id: draft.id,
      places: draft.places,
      media: uploadedMedia,
    };

    const res = await fetch('/api/dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postPayload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || 'Lưu buổi hẹn thất bại');
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
