'use client';

import { BookHeart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { useLocale } from '@/components/providers/locale-provider';

export function DashboardEmptyDates() {
  const { t } = useLocale();
  const router = useRouter();

  return (
    <EmptyState
      icon={<BookHeart size={28} />}
      title={t('empty.noRecentDates')}
      description={t('empty.noRecentDatesDesc')}
      action={() => router.push('/dates/new')}
      actionLabel={t('empty.addDate')}
    />
  );
}
