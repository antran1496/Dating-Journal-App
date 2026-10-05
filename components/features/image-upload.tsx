'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const { toast } = useToast();

  previewRef.current = previewUrl;

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

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

    // Hiển thị preview ngay lập tức
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);
    setError(null);

    try {
      const publicUrl = await uploadImage(file, { bucket, folder });
      onChange(publicUrl);
    } catch (err: any) {
      console.error('[ImageUpload Exception]:', err);
      const errMsg = err?.message || 'Đã xảy ra lỗi khi tải ảnh lên. Vui lòng thử lại!';
      setError(errMsg);
      toast({ type: 'error', title: errMsg });
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
    }
  };

  const handleRemove = async () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onChange(null);
  };

  const displayImage = previewUrl || value;

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`relative rounded-[var(--radius-lg)] border-2 border-dashed transition-all duration-200 overflow-hidden ${
          displayImage ? 'border-border' : 'border-border hover:border-primary/50'
        }`}
        style={{ minHeight: '160px' }}
      >
        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt="Check-in"
              className="w-full h-full object-cover"
              style={{ minHeight: '160px', maxHeight: '280px' }}
            />

            {isUploading && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 text-white">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
                <span className="text-xs font-medium">Đang tải ảnh lên...</span>
              </div>
            )}

            {!isUploading && (
              <>
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
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted hover:text-primary transition-colors"
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            ) : (
              <>
                <Upload size={32} className="opacity-50" />
                <span className="text-sm font-medium">Thêm ảnh check-in</span>
                <span className="text-xs opacity-60">PNG, JPG, WEBP — tự động nén siêu tốc</span>
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
