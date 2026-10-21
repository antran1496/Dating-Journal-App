'use client';

import React, { useState, useRef } from 'react';
import {
  Camera,
  Video,
  X,
  Plus,
  MapPin,
  Calendar,
  Coins,
  Lock,
  Loader2,
  Trash2,
} from 'lucide-react';
import type { DateEntry, DateMood, DatePlace } from '@/types';
import type {
  DateFormValues,
  DatePlaceInput,
  DateMediaInput,
} from '@/types/forms';
import { makeThumbnail, extractVideoPoster } from '@/lib/image/image-compress';
import { saveDraft } from '@/lib/drafts';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { PlacePicker } from '@/components/features/place-picker';

export interface CreateDatePayload extends DateFormValues {
  places?: DatePlaceInput[];
  media?: DateMediaInput[];
  checkin_image_url?: string;
  checkin_image_urls?: string[];
}

export type DateFormDefaultValues = Omit<Partial<DateEntry>, 'places'> & {
  places?: (DatePlaceInput | Partial<DatePlace>)[];
};

interface DateFormProps {
  coupleId?: string;
  defaultValues?: DateFormDefaultValues;
  onSubmit: (values: CreateDatePayload) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const MOODS: { id: DateMood; label: string; emoji: string }[] = [
  { id: 'love', label: 'Yêu', emoji: '❤️' },
  { id: 'happy', label: 'Vui', emoji: '😊' },
  { id: 'calm', label: 'Bình yên', emoji: '🌿' },
  { id: 'excited', label: 'Hào hứng', emoji: '✨' },
  { id: 'tired', label: 'Mệt', emoji: '🥱' },
  { id: 'sad', label: 'Buồn', emoji: '🥺' },
];

const SUGGESTED_TAGS = ['#càphê', '#ăn_uống', '#du_lịch', '#xemphim', '#kỷ_niệm', '#ở_nhà'];

interface UploadingMediaItem {
  id: string;
  file: File;
  kind: 'image' | 'video';
  previewUrl: string;
  progress: number;
  uploadedPath?: string;
  thumbPath?: string;
  width?: number;
  height?: number;
  duration_s?: number;
  bytes?: number;
  error?: string;
}

export function DateForm({ coupleId, defaultValues, onSubmit, onCancel, isLoading }: DateFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [mediaList, setMediaList] = useState<UploadingMediaItem[]>(() => {
    if (defaultValues?.media && defaultValues.media.length > 0) {
      return defaultValues.media.map((m) => ({
        id: m.id,
        file: new File([], 'existing'),
        kind: m.kind,
        previewUrl: `/api/media/${m.id}?size=thumb`,
        progress: 100,
        uploadedPath: m.path,
        thumbPath: m.thumb_path || undefined,
        width: m.width || undefined,
        height: m.height || undefined,
        duration_s: m.duration_s || undefined,
        bytes: m.bytes || undefined,
      }));
    }
    if (defaultValues?.checkin_image_urls && defaultValues.checkin_image_urls.length > 0) {
      return defaultValues.checkin_image_urls.map((url, i) => ({
        id: `legacy-${i}`,
        file: new File([], 'legacy'),
        kind: /\.(mp4|mov)$/i.test(url) ? 'video' : 'image',
        previewUrl: url,
        progress: 100,
        uploadedPath: url,
      }));
    }
    if (defaultValues?.checkin_image_url) {
      return [
        {
          id: 'legacy-single',
          file: new File([], 'legacy'),
          kind: 'image',
          previewUrl: defaultValues.checkin_image_url,
          progress: 100,
          uploadedPath: defaultValues.checkin_image_url,
        },
      ];
    }
    return [];
  });

  const [mood, setMood] = useState<DateMood | undefined>(defaultValues?.mood ?? undefined);
  const [note, setNote] = useState<string>(defaultValues?.note ?? '');

  // Places
  const [places, setPlaces] = useState<DatePlaceInput[]>(() => {
    if (defaultValues?.places && defaultValues.places.length > 0) {
      return defaultValues.places.map((p) => ({
        name: p.name || '',
        lat: p.lat ?? null,
        lng: p.lng ?? null,
        area_label: p.area_label ?? null,
        position: p.position,
      }));
    }
    if (defaultValues?.location_name) {
      return [
        {
          name: defaultValues.location_name,
          lat: defaultValues.location_lat ?? null,
          lng: defaultValues.location_lng ?? null,
        },
      ];
    }
    return [{ name: '' }];
  });

  // Dates
  const [dateTime, setDateTime] = useState<string>(() => {
    if (defaultValues?.date_time) {
      return new Date(defaultValues.date_time).toISOString().slice(0, 10);
    }
    return new Date().toISOString().slice(0, 10);
  });
  const [showEndDate, setShowEndDate] = useState<boolean>(Boolean(defaultValues?.end_date));
  const [endDate, setEndDate] = useState<string>(() => {
    if (defaultValues?.end_date) {
      return new Date(defaultValues.end_date).toISOString().slice(0, 10);
    }
    return '';
  });

  // Tags
  const [tags, setTags] = useState<string[]>(defaultValues?.tags ?? []);

  // Spend & Payer (Formatted with VND dots)
  const [spendVnd, setSpendVnd] = useState<string>(() => {
    return defaultValues?.spend_vnd ? String(defaultValues.spend_vnd) : '';
  });
  const [payerType, setPayerType] = useState<'me' | 'partner' | 'split'>(() => {
    if (defaultValues?.paid_split) return 'split';
    if (defaultValues?.paid_by === 'partner') return 'partner';
    return 'me';
  });

  // Ghi chú thêm (giữ lại từ field pros cũ)
  const [pros, setPros] = useState<string>(defaultValues?.pros ?? defaultValues?.note ?? '');

  // Validation & Submit State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper for VND formatting
  const formatVndDisplay = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('vi-VN');
  };

  const handleSpendChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setSpendVnd(digits);
  };

  // Upload handler for files
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check media limit
    const remainingSlots = 9 - mediaList.length;
    if (remainingSlots <= 0) {
      toast({ type: 'warning', title: 'Tối đa 9 ảnh hoặc video' });
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    const hasExistingVideo = mediaList.some((m) => m.kind === 'video');

    const newItems: UploadingMediaItem[] = [];

    for (const file of selectedFiles) {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov)$/i.test(file.name);
      if (isVideo && (hasExistingVideo || newItems.some((m) => m.kind === 'video'))) {
        toast({ type: 'warning', title: 'Mỗi kỷ niệm chỉ được lưu tối đa 1 video' });
        continue;
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const previewUrl = URL.createObjectURL(file);

      newItems.push({
        id,
        file,
        kind: isVideo ? 'video' : 'image',
        previewUrl,
        progress: 10,
        bytes: file.size,
      });
    }

    if (newItems.length === 0) return;

    setMediaList((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Upload items in background
    for (const item of newItems) {
      uploadSingleMedia(item);
    }
  };

  const uploadSingleMedia = async (item: UploadingMediaItem) => {
    try {
      const uploadFile = item.file;
      let width: number | undefined = undefined;
      let height: number | undefined = undefined;
      let duration_s: number | undefined = undefined;

      // Extract metadata or posters
      if (item.kind === 'video') {
        try {
          const videoInfo = await extractVideoPoster(item.file);
          duration_s = Math.round(videoInfo.duration);
          width = videoInfo.width;
          height = videoInfo.height;
        } catch {
          // Fallback if video frame extraction fails
        }
      } else {
        try {
          await makeThumbnail(item.file);
        } catch {
          // Fallback
        }
      }

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('kind', item.kind);
      if (width) formData.append('width', String(width));
      if (height) formData.append('height', String(height));
      if (duration_s) formData.append('duration_s', String(duration_s));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Tải ảnh/video thất bại');
      }

      const json = await res.json();
      const uploadedData = json.data;

      setMediaList((prev) =>
        prev.map((m) =>
          m.id === item.id
            ? {
                ...m,
                progress: 100,
                uploadedPath: uploadedData.path,
                thumbPath: uploadedData.thumb_path,
                width: uploadedData.width || width,
                height: uploadedData.height || height,
                duration_s: uploadedData.duration_s || duration_s,
                bytes: uploadedData.bytes,
              }
            : m
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tải lên thất bại';
      setMediaList((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, progress: 0, error: msg } : m))
      );
    }
  };

  const handleRemoveMedia = (id: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddTag = (tag: string) => {
    const formatted = tag.startsWith('#') ? tag : `#${tag}`;
    if (!tags.includes(formatted) && tags.length < 5) {
      setTags([...tags, formatted]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handlePlaceChange = (index: number, val: DatePlaceInput) => {
    setPlaces((prev) => prev.map((p, i) => (i === index ? val : p)));
  };

  const handleAddPlace = () => {
    if (places.length < 8) {
      setPlaces([...places, { name: '' }]);
    }
  };

  const handleRemovePlace = (index: number) => {
    setPlaces(places.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const activeCoupleId = coupleId || defaultValues?.couple_id;
    if (!activeCoupleId) {
      setErrorMessage('Chưa có thông tin cặp đôi. Vui lòng tải lại trang.');
      return;
    }

    // Rule: Must have at least 1 media OR note OR location OR pros
    const validPlaces = places.filter((p) => p.name.trim().length > 0);
    const hasMedia = mediaList.length > 0;
    const hasNote = note.trim().length > 0;
    const hasLocation = validPlaces.length > 0;
    const hasPros = pros.trim().length > 0;

    if (!hasMedia && !hasNote && !hasLocation && !hasPros) {
      setErrorMessage('Cần ít nhất một ảnh/video, địa điểm hoặc một dòng ghi chú để lưu kỷ niệm 💕');
      return;
    }

    // Check if media still uploading
    const stillUploading = mediaList.some((m) => !m.uploadedPath && !m.error);
    if (stillUploading) {
      toast({ type: 'info', title: 'Đang tải ảnh lên, vui lòng đợi giây lát...' });
      return;
    }

    setIsSubmitting(true);

    const preparedMedia: DateMediaInput[] = mediaList
      .filter((m) => m.uploadedPath)
      .map((m, idx) => ({
        path: m.uploadedPath!,
        thumb_path: m.thumbPath ?? null,
        kind: m.kind,
        width: m.width ?? null,
        height: m.height ?? null,
        duration_s: m.duration_s ?? null,
        bytes: m.bytes ?? null,
        position: idx,
      }));

    const parsedSpend = spendVnd.trim() ? Number(spendVnd.replace(/\D/g, '')) : null;

    const payload: CreateDatePayload = {
      note: note.trim() || undefined,
      mood: mood || undefined,
      date_time: dateTime || undefined,
      end_date: showEndDate && endDate ? endDate : undefined,
      location_name: validPlaces[0]?.name || undefined,
      places: validPlaces.length > 0 ? validPlaces : undefined,
      media: preparedMedia.length > 0 ? preparedMedia : undefined,
      tags: tags.length > 0 ? tags : undefined,
      spend_vnd: parsedSpend,
      paid_by: payerType === 'split' ? null : payerType,
      paid_split: payerType === 'split',
      pros: pros.trim() || undefined,
      checkin_image_url: preparedMedia[0]?.path,
      checkin_image_urls: preparedMedia.map((m) => m.path),
    };

    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      console.warn('[DateForm Submit Error]', err);
      const isNetworkError =
        typeof navigator !== 'undefined' &&
        (!navigator.onLine ||
          (err instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(err.message)));

      if (isNetworkError) {
        try {
          const clientId = crypto.randomUUID();
          await saveDraft({
            id: clientId,
            couple_id: activeCoupleId,
            form: payload,
            places: validPlaces,
            mediaFiles: mediaList
              .filter((m) => !m.uploadedPath)
              .map((m) => ({
                id: m.id,
                blob: m.file,
                name: m.file.name,
                type: m.file.type,
                kind: m.kind,
                width: m.width,
                height: m.height,
                duration_s: m.duration_s,
              })),
            uploadedMedia: preparedMedia,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: 'pending',
            lastError: err instanceof Error ? err.message : 'Lỗi kết nối',
          });

          toast({
            type: 'info',
            title: 'Mạng hơi yếu — Mình giữ bản nháp cho bạn, thử lại sau nhé.',
          });
          router.push('/dates');
          return;
        } catch {
          // If draft saving also fails, fall through to inline error display
        }
      }

      setErrorMessage(err instanceof Error ? err.message : 'Không thể lưu buổi hẹn');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* 1. 📸 Khoảnh khắc (ảnh/video) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-text flex items-center gap-1.5">
            <Camera size={16} className="text-primary" />
            <span>Khoảnh khắc</span>
            <span className="text-xs text-text-muted font-normal">(tối đa 9 ảnh/video)</span>
          </label>
          <span className="text-xs text-text-muted">{mediaList.length}/9</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {mediaList.map((m) => (
            <div
              key={m.id}
              className="relative aspect-square rounded-[var(--radius-md)] overflow-hidden bg-surface-hover border border-border group"
            >
              {m.kind === 'video' ? (
                <div className="w-full h-full relative bg-neutral-900 flex items-center justify-center">
                  <video src={m.previewUrl} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Video size={20} className="text-white" />
                  </div>
                </div>
              ) : (
                <img src={m.previewUrl} alt="Preview" className="w-full h-full object-cover" />
              )}

              {/* Uploading Spinner */}
              {!m.uploadedPath && !m.error && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={20} className="text-white animate-spin" />
                </div>
              )}

              {/* Error overlay */}
              {m.error && (
                <div className="absolute inset-0 bg-red-900/60 p-1 flex items-center justify-center text-[10px] text-white text-center">
                  Lỗi
                </div>
              )}

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleRemoveMedia(m.id)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                aria-label="Xoá media"
              >
                <X size={13} />
              </button>
            </div>
          ))}

          {mediaList.length < 9 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square flex flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-text-muted hover:text-primary p-2 cursor-pointer"
            >
              <Plus size={22} />
              <span className="text-[11px] font-medium text-center">Thêm ảnh/video</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 💭 Hôm nay hai bạn thấy thế nào? (Mood + Note) */}
      <div>
        <label className="block text-sm font-semibold text-text mb-2">
          Hôm nay hai bạn thấy thế nào?
        </label>

        {/* Mood chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {MOODS.map((m) => {
            const isSelected = mood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(isSelected ? undefined : m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-primary-fg shadow-sm scale-105'
                    : 'bg-surface hover:bg-surface-hover text-text border border-border'
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1 dòng Note */}
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Một dòng cho hôm nay..."
          maxLength={500}
          className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] bg-surface border border-border text-text placeholder:text-text-muted text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* 3. 📍 Địa điểm (nhập địa chỉ như Google Maps) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-text flex items-center gap-1.5">
            <MapPin size={16} className="text-primary" />
            <span>Địa điểm</span>
          </label>
          {places.length < 8 && (
            <button
              type="button"
              onClick={handleAddPlace}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} /> Thêm điểm dừng
            </button>
          )}
        </div>

        <div className="space-y-2">
          {places.map((place, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex-1">
                <PlacePicker
                  value={place}
                  onChange={(val) => handlePlaceChange(idx, val)}
                  placeholder={idx === 0 ? 'Nhập địa chỉ hoặc tên quán (như Google Maps)...' : `Điểm dừng ${idx + 1}...`}
                />
              </div>
              {places.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePlace(idx)}
                  className="p-2 text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                  aria-label="Xoá điểm dừng"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. 🗓️ Khi nào (Ngày & Đến ngày) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-text flex items-center gap-1.5">
            <Calendar size={16} className="text-primary" />
            <span>Khi nào</span>
          </label>
          <button
            type="button"
            onClick={() => setShowEndDate(!showEndDate)}
            className="text-xs text-primary font-medium hover:underline cursor-pointer"
          >
            {showEndDate ? 'Chuyến đi 1 ngày' : '+ Chuyến đi nhiều ngày'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <input
              type="date"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full h-[42px] px-3.5 py-2 rounded-[var(--radius-md)] bg-surface border border-border text-text text-sm focus:outline-none focus:border-primary transition-colors appearance-none"
            />
          </div>

          {showEndDate && (
            <div>
              <input
                type="date"
                value={endDate}
                min={dateTime}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Đến ngày"
                className="w-full h-[42px] px-3.5 py-2 rounded-[var(--radius-md)] bg-surface border border-border text-text text-sm focus:outline-none focus:border-primary transition-colors appearance-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* 5. 🏷️ Gắn thẻ */}
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">
          Gắn thẻ (tối đa 5 thẻ)
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-red-500 cursor-pointer"
                aria-label={`Xoá thẻ ${tag}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>

        {tags.length < 5 && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => handleAddTag(sug)}
                className="px-2 py-1 rounded-full bg-surface hover:bg-surface-hover border border-border text-text-muted text-xs hover:text-text transition-colors cursor-pointer"
              >
                + {sug}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6. 💸 Chi tiêu & Ai trả? */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5 mb-1.5">
            <Coins size={14} className="text-primary" />
            <span>Chi tiêu (₫)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={formatVndDisplay(spendVnd)}
              onChange={handleSpendChange}
              placeholder="0 ₫ (không bắt buộc)"
              className="w-full pl-3.5 pr-8 py-2 rounded-[var(--radius-md)] bg-surface border border-border text-text placeholder:text-text-muted text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
              ₫
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Ai trả?</label>
          <div className="grid grid-cols-3 gap-1 bg-surface p-1 rounded-[var(--radius-md)] border border-border text-xs">
            <button
              type="button"
              onClick={() => setPayerType('me')}
              className={`py-1.5 rounded-[var(--radius-sm)] font-medium transition-colors cursor-pointer ${
                payerType === 'me' ? 'bg-primary text-primary-fg shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              Tôi
            </button>
            <button
              type="button"
              onClick={() => setPayerType('partner')}
              className={`py-1.5 rounded-[var(--radius-sm)] font-medium transition-colors cursor-pointer ${
                payerType === 'partner' ? 'bg-primary text-primary-fg shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              Người ấy
            </button>
            <button
              type="button"
              onClick={() => setPayerType('split')}
              className={`py-1.5 rounded-[var(--radius-sm)] font-medium transition-colors cursor-pointer ${
                payerType === 'split' ? 'bg-primary text-primary-fg shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              Chia đôi
            </button>
          </div>
        </div>
      </div>

      {/* 7. 📝 Ghi chú thêm (giữ lại 1 field điểm hay ở dữ liệu cũ) */}
      <div>
        <label className="block text-xs font-semibold text-text mb-1.5">
          📝 Ghi chú thêm
        </label>
        <textarea
          value={pros}
          onChange={(e) => setPros(e.target.value)}
          placeholder="Kỷ niệm, điểm ấn tượng hoặc lưu ý về buổi hẹn..."
          rows={3}
          maxLength={500}
          className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] bg-surface border border-border text-text placeholder:text-text-muted text-sm focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      {/* Privacy notice */}
      <div className="flex items-center gap-2 py-2 text-xs text-text-muted">
        <Lock size={13} className="text-primary/70" />
        <span>🔒 Chỉ hai bạn thấy nội dung này.</span>
      </div>

      {/* Error display */}
      {errorMessage && (
        <div className="p-3 rounded-[var(--radius-md)] bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
          {errorMessage}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || isLoading}
            className="px-4 py-2.5 rounded-[var(--radius-md)] border border-border text-text text-sm font-medium hover:bg-surface-hover transition-colors cursor-pointer"
          >
            Hủy
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-md)] bg-primary text-primary-fg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm cursor-pointer"
        >
          {isSubmitting || isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <span>Lưu kỷ niệm ✨</span>
          )}
        </button>
      </div>
    </form>
  );
}
