'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Calendar, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RatingStars } from './rating-stars';
import { ImageUpload } from './image-upload';
import { dateFormSchema, type DateFormValues } from '@/types/forms';
import type { DateEntry } from '@/types';

interface DateFormProps {
  defaultValues?: Partial<DateEntry>;
  onSubmit: (values: DateFormValues & { checkin_image_url?: string }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function DateForm({ defaultValues, onSubmit, onCancel, isLoading }: DateFormProps) {
  const [imageUrl, setImageUrl] = React.useState<string | null>(defaultValues?.checkin_image_url ?? null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DateFormValues>({
    resolver: zodResolver(dateFormSchema),
    defaultValues: {
      location_name: defaultValues?.location_name ?? '',
      date_time: defaultValues?.date_time ? new Date(defaultValues.date_time).toISOString().slice(0, 16) : '',
      pros: defaultValues?.pros ?? '',
      cons: defaultValues?.cons ?? '',
      wish_next_time: defaultValues?.wish_next_time ?? '',
      rating: defaultValues?.rating ?? undefined,
    },
  });

  const rating = watch('rating');

  const handleFormSubmit = async (values: DateFormValues) => {
    await onSubmit({ ...values, checkin_image_url: imageUrl ?? undefined });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Ảnh check-in */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">📸 Ảnh check-in</label>
        <ImageUpload value={imageUrl} onChange={setImageUrl} />
      </div>

      {/* Địa điểm */}
      <Input
        {...register('location_name')}
        label="📍 Địa điểm *"
        placeholder="Cafe Runam, nhà hàng Cục Gạch..."
        error={errors.location_name?.message}
        icon={<MapPin size={16} />}
        iconPosition="left"
      />

      {/* Thời gian */}
      <Input
        {...register('date_time')}
        type="datetime-local"
        label="🕐 Thời gian"
        icon={<Calendar size={16} />}
        iconPosition="left"
      />

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">⭐ Đánh giá buổi hẹn</label>
        <RatingStars
          value={rating}
          onChange={(v) => setValue('rating', v, { shouldValidate: true })}
          size="lg"
        />
        {errors.rating && (
          <p className="mt-1 text-xs text-[var(--color-error)]">{errors.rating.message}</p>
        )}
      </div>

      {/* Điểm cộng */}
      <Textarea
        {...register('pros')}
        label="✅ Điểm hay (Pros)"
        placeholder="Không khí lãng mạn, đồ ăn ngon, được nắm tay nhau..."
        maxLength={500}
        autoResize
      />

      {/* Điểm trừ */}
      <Textarea
        {...register('cons')}
        label="🔧 Điểm cần cải thiện (Cons)"
        placeholder="Hơi ồn, đường đi xa, thiếu chỗ ngồi riêng tư..."
        maxLength={500}
        autoResize
      />

      {/* Mong muốn lần sau */}
      <Textarea
        {...register('wish_next_time')}
        label="💭 Muốn thử lần sau"
        placeholder="Lần sau muốn thử đi picnic, xem phim..."
        maxLength={300}
        autoResize
      />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
          {defaultValues?.id ? 'Lưu thay đổi' : 'Thêm buổi hẹn 💕'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Huỷ
          </Button>
        )}
      </div>
    </form>
  );
}
