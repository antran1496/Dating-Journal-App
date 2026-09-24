'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDeleteDate } from '@/hooks/use-date-mutations';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useToast } from '@/components/ui/toast';
import { useLocale } from '@/components/providers/locale-provider';

interface DeleteDateButtonProps {
  id: string;
  coupleId: string;
}

export function DeleteDateButton({ id, coupleId }: DeleteDateButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const deleteDate = useDeleteDate(coupleId);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLocale();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteDate.mutateAsync(id);
      setIsModalOpen(false);
      toast({ type: 'success', title: t('toast.dateDeleted') });
      router.push('/dates');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({ type: 'error', title: t('toast.error') });
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10 px-2 py-1 h-auto"
      >
        <Trash2 size={16} className="mr-1" /> {t('common.delete')}
      </Button>
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title={t('toast.deleteConfirmTitle')}
        description={t('toast.deleteConfirmDesc')}
        confirmLabel={t('toast.delete')}
        cancelLabel={t('toast.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
