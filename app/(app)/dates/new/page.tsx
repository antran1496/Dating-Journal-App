'use client';

import { DateForm } from '@/components/features/date-form';
import { BackButton } from '@/components/ui/back-button';
import { createClient } from '@/lib/supabase/client';
import type { DateFormValues } from '@/types/forms';
import { useSessionUser } from '@/components/providers/session-provider';
import { useCreateDate } from '@/hooks/use-date-mutations';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function NewDateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultDateParam = searchParams.get('date');
  const supabase = createClient();

  const { user } = useSessionUser();

  const { data: coupleId } = useQuery({
    queryKey: ['couple-id'],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('profile_id', user.id)
        .maybeSingle();
      return data?.couple_id ?? null;
    },
  });

  const createMutation = useCreateDate(coupleId || '');

  const handleSubmit = async (values: DateFormValues & { checkin_image_url?: string }) => {
    if (!coupleId) return;

    try {
      await createMutation.mutateAsync(values);
      router.push('/dates');
      router.refresh();
    } catch (err: any) {
      throw new Error(err.message || 'Không thể tạo buổi hẹn');
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BackButton fallback="/dates" forceFallback className="p-2 rounded-[var(--radius-md)] hover:bg-surface-hover" />
        <div>
          <h1 className="font-heading text-xl font-bold text-text">Ghi buổi hẹn mới 💕</h1>
          <p className="text-text-muted text-sm">Lưu lại kỷ niệm của bạn</p>
        </div>
      </div>

      <div className="bg-surface rounded-[var(--radius-lg)] border border-border p-6">
        <DateForm
          defaultValues={defaultDateParam ? { date_time: defaultDateParam } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/dates')}
        />
      </div>
    </div>
  );
}

export default function NewDatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Đang tải...</div>}>
      <NewDateContent />
    </Suspense>
  );
}
