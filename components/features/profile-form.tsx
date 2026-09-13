'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { ImageUpload } from './image-upload';
import { profileFormSchema, type ProfileFormValues } from '@/types/forms';
import type { Profile } from '@/types';

interface ProfileFormProps {
  profile: Profile;
  onSuccess?: () => void;
}

export function ProfileForm({ profile, onSuccess }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      display_name: profile.display_name ?? '',
      birth_date: profile.birth_date ?? '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ ...values, avatar_url: avatarUrl })
      .eq('id', profile.id);

    if (updateError) {
      setError('Không thể cập nhật, vui lòng thử lại');
      setIsLoading(false);
      return;
    }

    // Invalidate couple query to refresh member data
    queryClient.invalidateQueries({ queryKey: ['couple'] });
    onSuccess?.();
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 text-[var(--color-error)] text-sm">
          {error}
        </div>
      )}

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <Avatar src={avatarUrl ?? undefined} name={profile.display_name ?? 'U'} size="xl" />
        <ImageUpload
          value={avatarUrl}
          onChange={setAvatarUrl}
          bucket="avatars"
          folder="avatar"
          className="w-full max-w-xs"
        />
      </div>

      <Input
        {...register('display_name')}
        label="Tên hiển thị"
        placeholder="Tên của bạn"
        error={errors.display_name?.message}
      />

      <Input
        {...register('birth_date')}
        type="date"
        label="Ngày sinh"
        helperText="Dùng để tính thần số học và cung hoàng đạo"
      />

      <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
        Lưu thay đổi
      </Button>
    </form>
  );
}
