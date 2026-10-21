'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DateForm } from '@/components/features/date-form';
import { BackButton } from '@/components/ui/back-button';
import { useCouple } from '@/hooks/use-couple';
import { useCreateDate, type CreateDatePayload } from '@/hooks/use-date-mutations';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { getDraft, deleteDraft, type OfflineDraft } from '@/lib/drafts';
import { FileText } from 'lucide-react';

function NewDateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultDateParam = searchParams.get('date');
  const draftIdParam = searchParams.get('draftId');

  const { couple, isLoading: isLoadingCouple } = useCouple();
  const createMutation = useCreateDate(couple?.id || '');

  const [loadedDraft, setLoadedDraft] = useState<OfflineDraft | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(Boolean(draftIdParam));

  useEffect(() => {
    if (!draftIdParam) return;
    let isMounted = true;
    getDraft(draftIdParam).then((d) => {
      if (isMounted) {
        setLoadedDraft(d);
        setIsLoadingDraft(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [draftIdParam]);

  const handleSubmit = async (values: CreateDatePayload) => {
    if (!couple?.id) {
      throw new Error('Chưa tải xong dữ liệu cặp đôi, vui lòng thử lại.');
    }

    try {
      await createMutation.mutateAsync(values);
      if (draftIdParam) {
        await deleteDraft(draftIdParam);
      }
      router.push('/dates');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo buổi hẹn';
      throw new Error(msg);
    }
  };

  if (isLoadingCouple || !couple || isLoadingDraft) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <LoadingSkeleton variant="text" width="60%" height="32px" />
        <LoadingSkeleton variant="rect" height="400px" className="rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  const initialValues = loadedDraft
    ? {
        couple_id: couple.id,
        note: loadedDraft.form.note || loadedDraft.form.pros || '',
        pros: loadedDraft.form.pros || loadedDraft.form.note || '',
        mood: loadedDraft.form.mood,
        date_time: loadedDraft.form.date_time,
        end_date: loadedDraft.form.end_date,
        spend_vnd: loadedDraft.form.spend_vnd,
        paid_by: loadedDraft.form.paid_by,
        paid_split: loadedDraft.form.paid_split,
        tags: loadedDraft.form.tags,
        places: loadedDraft.places,
        checkin_image_urls: loadedDraft.uploadedMedia?.map((m) => m.path),
      }
    : {
        couple_id: couple.id,
        ...(defaultDateParam ? { date_time: defaultDateParam } : {}),
      };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BackButton fallback="/dates" forceFallback className="p-2 rounded-[var(--radius-md)] hover:bg-surface-hover" />
        <div>
          <h1 className="font-heading text-xl font-bold text-text">
            {draftIdParam ? 'Chỉnh sửa bản nháp 💕' : 'Ghi buổi hẹn mới 💕'}
          </h1>
          <p className="text-text-muted text-sm">
            {draftIdParam ? 'Xem lại và gửi bản nháp lên hệ thống' : 'Lưu lại kỷ niệm của bạn'}
          </p>
        </div>
      </div>

      {draftIdParam && loadedDraft && (
        <div className="mb-4 p-3 rounded-[var(--radius-md)] bg-primary/10 border border-primary/20 text-xs text-text flex items-center gap-2">
          <FileText size={15} className="text-primary shrink-0" />
          <span>
            Đang mở bản nháp từ thiết bị của bạn. Chỉnh sửa và bấm &quot;Lưu kỷ niệm&quot; để gửi lên đám mây.
          </span>
        </div>
      )}

      <div className="bg-surface rounded-[var(--radius-lg)] border border-border p-6">
        <DateForm
          key={loadedDraft ? loadedDraft.id : 'new-date'}
          coupleId={couple.id}
          defaultValues={initialValues}
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
