'use client';

import React, { useRef, useState } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { uploadImage } from '@/lib/image/upload-image';

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
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      const msg = 'Chỉ hỗ trợ file ảnh (PNG, JPG, WEBP,...)';
      setError(msg);
      toast({ type: 'error', title: msg });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      const msg = 'Kích thước ảnh không được vượt quá 20MB';
      setError(msg);
      toast({ type: 'error', title: msg });
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const publicUrl = await uploadImage(file, { bucket, folder });
      onChange(publicUrl);
    } catch (err: any) {
      console.error('Upload Exception:', err);
      const errMsg = err?.message || 'Đã xảy ra lỗi khi tải ảnh lên. Vui lòng thử lại!';
      setError(errMsg);
      toast({ type: 'error', title: errMsg });
    } finally {
      setIsUploading(false);
    }
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
