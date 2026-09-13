'use client';

import React, { useRef, useState } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  folder?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  bucket = 'checkin-images',
  folder = 'checkin',
  className = '',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Chỉ hỗ trợ file ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh không được vượt quá 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Chưa đăng nhập');
      setIsUploading(false);
      return;
    }

    const ext = file.name.split('.').pop();
    // Bắt buộc prefix userId vào folder để vượt qua RLS policy kiểm tra (storage.foldername(name))[1]
    const path = `${user.id}/${folder}/${Date.now()}.${ext}`;

    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error('Upload Error:', uploadError);
      setError('Tải ảnh thất bại, vui lòng thử lại');
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    onChange(publicUrl);
    setIsUploading(false);
  };

  const handleRemove = async () => {
    if (!value) return;
    onChange(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`relative rounded-[var(--radius-lg)] border-2 border-dashed transition-all duration-200 overflow-hidden ${
          value ? 'border-border' : 'border-border hover:border-primary/50'
        }`}
        style={{ minHeight: '160px' }}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Check-in"
              className="w-full h-full object-cover"
              style={{ minHeight: '160px', maxHeight: '280px' }}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X size={16} />
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs hover:bg-black/70 transition-colors"
            >
              <Camera size={14} />
              Thay ảnh
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted hover:text-primary transition-colors"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full border-2 border-primary border-t-transparent w-8 h-8" />
            ) : (
              <>
                <Upload size={32} className="opacity-50" />
                <span className="text-sm font-medium">Thêm ảnh check-in</span>
                <span className="text-xs opacity-60">PNG, JPG, WEBP — tối đa 5MB</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
