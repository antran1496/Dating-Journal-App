import { compressImage } from './image-compress';

export interface UploadOptions {
  bucket: string;
  folder: string;
  timeoutMs?: number;
}

export async function uploadImage(file: File, options: UploadOptions): Promise<string> {
  const { bucket, folder, timeoutMs = 60000 } = options;
  
  const compressedFile = await compressImage(file);
  
  const formData = new FormData();
  formData.append('file', compressedFile);
  formData.append('bucket', bucket);
  formData.append('folder', folder);

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(id);

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(json.error || 'Tải ảnh thất bại, vui lòng thử lại');
    }

    return json.data.url;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error('Đã quá hạn thời gian tải ảnh lên (Timeout)');
    }
    throw err;
  }
}
