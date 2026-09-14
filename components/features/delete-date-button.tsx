'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDeleteDate } from '@/hooks/use-date-mutations';
import { Button } from '@/components/ui/button';

interface DeleteDateButtonProps {
  id: string;
  coupleId: string;
}

export function DeleteDateButton({ id, coupleId }: DeleteDateButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteDate = useDeleteDate(coupleId);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá buổi hẹn này không? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteDate.mutateAsync(id);
      router.push('/dates');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Không thể xoá buổi hẹn. Vui lòng thử lại.');
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      isLoading={isDeleting}
      className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10 px-2 py-1 h-auto"
    >
      <Trash2 size={16} className="mr-1" /> Xoá
    </Button>
  );
}
