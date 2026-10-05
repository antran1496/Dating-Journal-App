'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Upload, Plus, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { uploadImage } from '@/lib/image/upload-image';

interface PendingUpload {
  id: string;
  file: File;
  previewUrl: string;
  status: 'uploading' | 'error';
  error?: string;
}

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  maxImages?: number;
  maxSizeMB?: number;
  bucket?: string;
  folder?: string;
  className?: string;
}

export function MultiImageUpload({
  value = [],
  onChange,
  onUploadingChange,
  maxImages = 9,
  maxSizeMB = 20,
  bucket = 'checkin-images',
  folder = 'checkin',
  className = '',
}: MultiImageUploadProps) {
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const valueRef = useRef(value);
  valueRef.current = value;

  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  // Báo cho component cha biết khi đang có tiến trình upload ảnh
  useEffect(() => {
    const isUploading = pending.some((p) => p.status === 'uploading');
    onUploadingChange?.(isUploading);
  }, [pending, onUploadingChange]);

  // Dọn dẹp bộ nhớ objectURL khi unmount
  useEffect(() => {
    return () => {
      pendingRef.current.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        const msg = `File "${file.name}" không phải là ảnh hợp lệ`;
        setError(msg);
        toast({ type: 'error', title: msg });
        continue;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        const msg = `Ảnh "${file.name}" vượt quá dung lượng ${maxSizeMB}MB`;
        setError(msg);
        toast({ type: 'error', title: msg });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const currentTotal = valueRef.current.length + pendingRef.current.length;
    const slotsLeft = Math.max(0, maxImages - currentTotal);
    const toUpload = validFiles.slice(0, slotsLeft);

    if (validFiles.length > slotsLeft) {
      const msg = `Chỉ còn ${slotsLeft} chỗ trống, đã bỏ qua ${validFiles.length - slotsLeft} ảnh`;
      setError(msg);
      toast({ type: 'error', title: msg });
    }

    if (toUpload.length === 0) return;

    // Tạo preview ngay lập tức để người dùng thấy ảnh tức thì không cần chờ upload
    const newPendingItems: PendingUpload[] = toUpload.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading',
    }));

    setPending((prev) => [...prev, ...newPendingItems]);

    // Hàng đợi upload tối ưu: 2 ảnh song song để không nghẽn mạng và tải nhanh nhất
    let index = 0;
    let inFlight = 0;

    const runWorker = () => {
      while (inFlight < 2 && index < newPendingItems.length) {
        const item = newPendingItems[index++];
        inFlight++;

        uploadImage(item.file, { bucket, folder })
          .then((publicUrl) => {
            // Thêm URL thành công vào danh sách
            const nextUrls = [...valueRef.current, publicUrl];
            valueRef.current = nextUrls;
            onChange(nextUrls);

            // Xóa khỏi danh sách pending và thu hồi previewUrl
            setPending((prev) => {
              const target = prev.find((p) => p.id === item.id);
              if (target) URL.revokeObjectURL(target.previewUrl);
              return prev.filter((p) => p.id !== item.id);
            });
          })
          .catch((err: any) => {
            console.error('[MultiImageUpload Error]', err);
            const errMsg = err?.message || 'Tải ảnh thất bại';
            setPending((prev) =>
              prev.map((p) =>
                p.id === item.id ? { ...p, status: 'error', error: errMsg } : p
              )
            );
            toast({ type: 'error', title: `Lỗi tải ảnh: ${errMsg}` });
          })
          .finally(() => {
            inFlight--;
            runWorker();
          });
      }
    };

    runWorker();
  };

  const handleRemoveUploaded = (indexToRemove: number) => {
    const nextUrls = value.filter((_, i) => i !== indexToRemove);
    valueRef.current = nextUrls;
    onChange(nextUrls);
  };

  const handleRemovePending = (id: string) => {
    setPending((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const remaining = Math.max(0, maxImages - (value.length + pending.length));

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {/* Ảnh đã tải lên thành công */}
        {value.map((url, i) => (
          <div
            key={url}
            className="relative aspect-square rounded-[var(--radius-md)] overflow-hidden border border-border group"
          >
            <img
              src={url}
              alt={`Ảnh ${i + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <button
              type="button"
              onClick={() => handleRemoveUploaded(i)}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-black/80"
              title="Xóa ảnh"
            >
              <X size={14} />
            </button>
            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {i + 1}/{value.length + pending.length}
            </div>
          </div>
        ))}

        {/* Ảnh đang trong tiến trình xử lý / upload (hiển thị preview ngay lập tức) */}
        {pending.map((item, idx) => (
          <div
            key={item.id}
            className="relative aspect-square rounded-[var(--radius-md)] overflow-hidden border border-border group"
          >
            <img
              src={item.previewUrl}
              alt="Preview"
              className="w-full h-full object-cover filter brightness-90"
            />

            {item.status === 'uploading' ? (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5 text-white">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
                <span className="text-[10px] font-medium tracking-wide">Đang tải...</span>
              </div>
            ) : (
              <div className="absolute inset-0 bg-red-950/70 flex flex-col items-center justify-center gap-1 text-white p-1 text-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-[10px] text-red-200">Lỗi tải ảnh</span>
                <button
                  type="button"
                  onClick={() => handleRemovePending(item.id)}
                  className="mt-1 text-[10px] underline text-white hover:text-red-200"
                >
                  Xóa
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleRemovePending(item.id)}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              title="Hủy ảnh này"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {/* Nút thêm ảnh */}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-[var(--radius-md)] border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-text-muted hover:text-primary transition-colors cursor-pointer"
          >
            <Plus size={24} />
            <span className="text-[10px] font-medium">
              {value.length === 0 && pending.length === 0 ? 'Thêm ảnh' : `+ ${remaining}`}
            </span>
          </button>
        )}
      </div>

      <p className="text-xs text-text-muted">
        Tối đa {maxImages} ảnh, tự động nén tối ưu hiển thị nhanh chóng
      </p>
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
