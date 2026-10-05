import React from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/supabase/auth';
import { redirect } from 'next/navigation';
import { DatesInfiniteList } from '@/components/features/dates-infinite-list';
import { DATES_PAGE_SIZE } from '@/hooks/use-dates';
import type { DateEntry } from '@/types';

export const metadata = {
  title: 'Buổi hẹn hò | Dating Journal',
};

export default async function DatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;

  const { data: memberData } = await db
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!memberData) redirect('/couple/setup');

  // Lấy 20 mục đầu tiên (trang 1) và tổng số lượng kỷ niệm (exact count)
  const { data: dates, count, error } = await db
    .from('dates')
    .select('*', { count: 'exact' })
    .eq('couple_id', memberData.couple_id)
    .order('date_time', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(0, DATES_PAGE_SIZE - 1);

  if (error) {
    console.error('[DatesPage] Error loading dates:', error);
  }

  const initialDates = (dates ?? []) as DateEntry[];
  const totalCount = count ?? initialDates.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Buổi hẹn hò 📅</h1>
          <p className="text-text-muted text-sm mt-1">{totalCount} kỷ niệm đã ghi lại</p>
        </div>
        <Link
          href="/dates/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] bg-primary text-primary-fg font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus size={18} /> Thêm mới
        </Link>
      </div>

      <DatesInfiniteList
        initialDates={initialDates}
        coupleId={memberData.couple_id}
      />
    </div>
  );
}
