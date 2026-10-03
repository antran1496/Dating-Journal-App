'use client';

import React, { useRef, useState } from 'react';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

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
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const displayUrl = localPreview || value;

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      const msg = 'Chỉ hỗ trợ file ảnh (PNG, JPG, WEBP,...)';
      setError(msg);
      toast({ type: 'error', title: msg });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      const msg = 'Kích thước ảnh không được vượt quá 5MB';
      setError(msg);
      toast({ type: 'error', title: msg });
      return;
    }

    setIsUploading(true);
    setError(null);

    // Create local object URL for instant UI feedback
    const tempUrl = URL.createObjectURL(file);
    setLocalPreview(tempUrl);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        const msg = 'Bạn cần đăng nhập để tải ảnh lên';
        setError(msg);
        toast({ type: 'error', title: msg });
        setLocalPreview(null);
        return;
      }

      const user = authData.user;
      const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const ext = rawExt.match(/^[a-z0-9]+$/) ? rawExt : 'jpg';
      // Bắt buộc prefix userId vào folder để vượt qua RLS policy kiểm tra (storage.foldername(name))[1]
      const path = `${user.id}/${folder}/${Date.now()}.${ext}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true,
          contentType: file.type || 'image/jpeg',
        });

      if (uploadError) {
        console.error('Upload Error:', uploadError);
        const errMsg = `Tải ảnh thất bại: ${uploadError.message}`;
        setError(errMsg);
        toast({ type: 'error', title: errMsg });
        setLocalPreview(null);
        return;
      }

      const targetPath = data?.path || path;
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(targetPath);
      onChange(publicUrl);
      setLocalPreview(null);
      toast({ type: 'success', title: 'Tải ảnh lên thành công! ✨' });
    } catch (err: any) {
      console.error('Upload Exception:', err);
      const errMsg = err?.message || 'Đã xảy ra lỗi khi tải ảnh lên. Vui lòng thử lại!';
      setError(errMsg);
      toast({ type: 'error', title: errMsg });
      setLocalPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setLocalPreview(null);
    onChange(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`relative rounded-[var(--radius-lg)] border-2 border-dashed transition-all duration-200 overflow-hidden ${
          displayUrl ? 'border-border' : 'border-border hover:border-primary/50'
        }`}
        style={{ minHeight: '160px' }}
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Check-in"
              className="w-full h-full object-cover"
              style={{ minHeight: '160px', maxHeight: '280px' }}
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 text-white z-10 animate-fadeIn">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-xs font-medium">Đang tải ảnh lên...</span>
              </div>
            )}
            {!isUploading && (
              <>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-20 cursor-pointer"
                >
                  <X size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs hover:bg-black/70 transition-colors z-20 cursor-pointer"
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
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted hover:text-primary transition-colors cursor-pointer"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-xs font-medium text-primary">Đang tải ảnh lên...</span>
              </div>
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

      {error && <p className="text-xs text-[var(--color-error)] font-medium">{error}</p>}

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
