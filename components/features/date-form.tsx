"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DateEntry } from "@/types";
import { dateFormSchema, type DateFormValues } from "@/types/forms";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { MultiImageUpload } from "./multi-image-upload";
import { RatingStars } from "./rating-stars";

import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/components/providers/locale-provider";

interface DateFormProps {
  defaultValues?: Partial<DateEntry>;
  onSubmit: (
    values: DateFormValues & {
      checkin_image_url?: string;
      checkin_image_urls?: string[];
    },
  ) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function DateForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: DateFormProps) {
  const { toast } = useToast();
  const { t } = useLocale();
  const [imageUrls, setImageUrls] = React.useState<string[]>(
    defaultValues?.checkin_image_urls ??
      (defaultValues?.checkin_image_url
        ? [defaultValues.checkin_image_url]
        : []),
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DateFormValues>({
    resolver: zodResolver(dateFormSchema),
    mode: 'onTouched',
    defaultValues: {
      location_name: defaultValues?.location_name ?? "",
      date_time: defaultValues?.date_time
        ? new Date(defaultValues.date_time).toISOString().slice(0, 10)
        : "",
      end_date: defaultValues?.end_date
        ? new Date(defaultValues.end_date).toISOString().slice(0, 10)
        : "",
      pros: defaultValues?.pros ?? "",
      cons: defaultValues?.cons ?? "",
      wish_next_time: defaultValues?.wish_next_time ?? "",
      rating: defaultValues?.rating ?? undefined,
    },
  });

  const rating = watch("rating");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingImages, setIsUploadingImages] = React.useState(false);

  const handleFormSubmit = async (values: DateFormValues) => {
    if (isSubmitting || isUploadingImages) return;
    setIsSubmitting(true);
    try {
      const sanitizedEndDate = values.end_date && values.end_date.trim() !== '' ? values.end_date : null;
      await onSubmit({
        ...values,
        end_date: sanitizedEndDate,
        checkin_image_urls: imageUrls,
        checkin_image_url: imageUrls.length > 0 ? imageUrls[0] : undefined,
      });
      toast({
        type: 'success',
        title: defaultValues?.id ? t('toast.dateUpdated') : t('toast.dateCreated'),
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : t('toast.error');
      toast({ type: 'error', title: message });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Ảnh check-in */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          📸 Ảnh buổi hẹn (tối đa 9 ảnh)
        </label>
        <MultiImageUpload
          value={imageUrls}
          onChange={setImageUrls}
          onUploadingChange={setIsUploadingImages}
        />
      </div>

      {/* Địa điểm */}
      <Input
        {...register("location_name")}
        label="📍 Địa điểm *"
        placeholder="Cafe Miền Đồng Thảo..."
        error={errors.location_name?.message}
        icon={<MapPin size={16} />}
        iconPosition="left"
      />

      {/* Thời gian */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          {...register("date_time")}
          type="date"
          label="🕐 Ngày bắt đầu *"
          error={errors.date_time?.message}
        />
        <Input
          {...register("end_date")}
          type="date"
          label="🏁 Ngày kết thúc (tuỳ chọn)"
          error={errors.end_date?.message}
        />
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          ⭐ Đánh giá buổi hẹn
        </label>
        <RatingStars
          value={rating}
          onChange={(v) => setValue("rating", v, { shouldValidate: true })}
          size="lg"
        />
        {errors.rating && (
          <p className="mt-1 text-xs text-[var(--color-error)]">
            {errors.rating.message}
          </p>
        )}
      </div>

      {/* Điểm cộng */}
      <Textarea
        {...register("pros")}
        label="✅ Điểm hay (Pros)"
        placeholder="Không khí lãng mạn, đồ ăn ngon, được nắm tay nhau..."
        maxLength={500}
        autoResize
      />

      {/* Điểm trừ */}
      <Textarea
        {...register("cons")}
        label="🔧 Điểm cần cải thiện (Cons)"
        placeholder="Hơi ồn, đường đi xa, thiếu chỗ ngồi riêng tư..."
        maxLength={500}
        autoResize
      />

      {/* Mong muốn lần sau */}
      <Textarea
        {...register("wish_next_time")}
        label="💭 Muốn thử lần sau"
        placeholder="Lần sau muốn thử đi picnic, xem phim..."
        maxLength={300}
        autoResize
      />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          isLoading={isLoading || isSubmitting}
          disabled={isUploadingImages}
        >
          {isUploadingImages
            ? 'Đang tải ảnh lên...'
            : defaultValues?.id
            ? 'Lưu thay đổi'
            : 'Thêm buổi hẹn 💕'}
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
