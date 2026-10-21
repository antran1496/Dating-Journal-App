'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DateForm } from '@/components/features/date-form';
import { BackButton } from '@/components/ui/back-button';
import { useCouple } from '@/hooks/use-couple';
import { useCreateDate, type CreateDatePayload } from '@/hooks/use-date-mutations';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

function NewDateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultDateParam = searchParams.get('date');

  const { couple, isLoading: isLoadingCouple } = useCouple();
  const createMutation = useCreateDate(couple?.id || '');

  const handleSubmit = async (values: CreateDatePayload) => {
    if (!couple?.id) {
      throw new Error('Chưa tải xong dữ liệu cặp đôi, vui lòng thử lại.');
    }

    try {
      await createMutation.mutateAsync(values);
      router.push('/dates');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo buổi hẹn';
      throw new Error(msg);
    }
  };

  if (isLoadingCouple || !couple) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <LoadingSkeleton variant="text" width="60%" height="32px" />
        <LoadingSkeleton variant="rect" height="400px" className="rounded-[var(--radius-lg)]" />
      </div>
    );
  }

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
          coupleId={couple.id}
          defaultValues={{
            couple_id: couple.id,
            ...(defaultDateParam ? { date_time: defaultDateParam } : {}),
          }}
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
