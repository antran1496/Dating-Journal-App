'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BackButton } from '@/components/ui/back-button';
import { useDateById } from '@/hooks/use-dates';
import { useQueryClient } from '@tanstack/react-query';
import { keys as queryKeys } from '@/lib/query/keys';
import { DateForm } from '@/components/features/date-form';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { useUpdateDate } from '@/hooks/use-date-mutations';
import type { CreateDatePayload } from '@/hooks/use-date-mutations';

export default function EditDatePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: date, isLoading } = useDateById(id);

  const updateMutation = useUpdateDate(date?.couple_id || '');

  const handleSubmit = async (values: CreateDatePayload) => {
    try {
      await updateMutation.mutateAsync({ id, ...values });
      router.push(`/dates/${id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật';
      throw new Error(msg);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BackButton fallback="/dates" forceFallback className="p-2 rounded-[var(--radius-md)] hover:bg-surface-hover" />
        <div>
          <h1 className="font-heading text-xl font-bold text-text">Chỉnh sửa buổi hẹn ✏️</h1>
          <p className="text-text-muted text-sm">Cập nhật thông tin kỷ niệm</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <LoadingSkeleton variant="rect" height="160px" />
          <LoadingSkeleton variant="text" />
          <LoadingSkeleton variant="text" width="60%" />
        </div>
      ) : date ? (
        <div className="bg-surface rounded-[var(--radius-lg)] border border-border p-6">
          <DateForm
            defaultValues={date}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/dates')}
          />
        </div>
      ) : (
        <p className="text-text-muted">Không tìm thấy buổi hẹn này.</p>
      )}
    </div>
  );
}
