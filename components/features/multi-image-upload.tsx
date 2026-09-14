'use client';

import React, { useRef, useState } from 'react';
import { Camera, X, Upload, Plus, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  bucket?: string;
  folder?: string;
  className?: string;
}

export function MultiImageUpload({
  value = [],
  onChange,
  maxImages = 9,
  maxSizeMB = 5,
  bucket = 'checkin-images',
  folder = 'checkin',
  className = '',
}: MultiImageUploadProps) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const remaining = maxImages - value.length;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Chưa đăng nhập'); return; }

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) { setError('Chỉ hỗ trợ file ảnh'); continue; }
      if (file.size > maxSizeMB * 1024 * 1024) { setError(`Ảnh "${file.name}" vượt quá ${maxSizeMB}MB`); continue; }
      validFiles.push(file);
    }

    const slotsLeft = maxImages - value.length;
    const toUpload = validFiles.slice(0, slotsLeft);
    if (validFiles.length > slotsLeft) {
      setError(`Chỉ còn ${slotsLeft} chỗ trống, đã bỏ qua ${validFiles.length - slotsLeft} ảnh`);
    }

    setUploadingCount(toUpload.length);

    const newUrls: string[] = [];
    for (const file of toUpload) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { data, error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (uploadError) {
        console.error('Upload Error:', uploadError);
        setError('Tải ảnh thất bại');
        continue;
      }
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
      newUrls.push(publicUrl);
      setUploadingCount((prev) => prev - 1);
    }

    if (newUrls.length > 0) {
      onChange([...value, ...newUrls]);
    }
    setUploadingCount(0);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {value.map((url, i) => (
          <div key={url} className="relative aspect-square rounded-[var(--radius-md)] overflow-hidden border border-border group">
            <img src={url} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <X size={14} />
            </button>
            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {i + 1}/{value.length}
            </div>
          </div>
        ))}

        {uploadingCount > 0 && Array.from({ length: uploadingCount }).map((_, i) => (
          <div key={`uploading-${i}`} className="aspect-square rounded-[var(--radius-md)] border-2 border-dashed border-primary/30 flex items-center justify-center bg-primary/5">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ))}

        {remaining > 0 && uploadingCount === 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-[var(--radius-md)] border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-text-muted hover:text-primary transition-colors cursor-pointer"
          >
            <Plus size={24} />
            <span className="text-[10px] font-medium">
              {value.length === 0 ? 'Thêm ảnh' : `+ ${remaining}`}
            </span>
          </button>
        )}
      </div>

      <p className="text-xs text-text-muted">Tối đa {maxImages} ảnh, mỗi ảnh ≤ {maxSizeMB}MB</p>
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
