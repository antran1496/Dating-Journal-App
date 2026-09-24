'use client';

import { CalendarHeart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { useLocale } from '@/components/providers/locale-provider';

export function DatesEmptyState() {
  const { t } = useLocale();
  const router = useRouter();

  return (
    <EmptyState
      icon={<CalendarHeart size={28} />}
      title={t('empty.noDates')}
      description={t('empty.noDatesDesc')}
      action={() => router.push('/dates/new')}
      actionLabel={t('empty.firstDate')}
    />
  );
}
