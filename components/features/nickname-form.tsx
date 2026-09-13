'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { nicknameFormSchema, type NicknameFormValues } from '@/types/forms';
import type { Profile } from '@/types';

interface NicknameFormProps {
  partner: Profile;
  currentNickname?: string | null;
  coupleId: string;
  onSuccess?: (nickname: string) => void;
}

export function NicknameForm({ partner, currentNickname, coupleId, onSuccess }: NicknameFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<NicknameFormValues>({
    resolver: zodResolver(nicknameFormSchema),
    defaultValues: { nickname: currentNickname ?? '' },
  });

  const onSubmit = async (values: NicknameFormValues) => {
    setIsLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Chưa đăng nhập'); setIsLoading(false); return; }

    // Upsert vào couple_members nickname column
    const { error: updateError } = await supabase
      .from('couple_members')
      .update({ nickname: values.nickname })
      .eq('couple_id', coupleId)
      .eq('profile_id', partner.id);

    if (updateError) {
      setError('Không thể lưu biệt danh, vui lòng thử lại');
      setIsLoading(false);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['couple'] });
    onSuccess?.(values.nickname);
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-surface-hover rounded-[var(--radius-md)]">
        <Avatar
          src={partner.avatar_url ?? undefined}
          name={partner.display_name ?? '?'}
          size="md"
        />
        <div>
          <p className="font-medium text-text text-sm">{partner.display_name}</p>
          {currentNickname && (
            <p className="text-text-muted text-xs">Biệt danh hiện tại: <span className="text-primary font-medium">{currentNickname}</span></p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-[var(--color-error)]">{error}</p>
      )}

      <Input
        {...register('nickname')}
        label="Biệt danh cho người ấy"
        placeholder="Gấu ơi, Bé yêu, Anh/Em..."
        error={errors.nickname?.message}
        icon={<Heart size={16} />}
        iconPosition="left"
      />

      <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
        Lưu biệt danh 💕
      </Button>
    </form>
  );
}
