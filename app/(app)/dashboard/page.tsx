import React from 'react';
import { Plus, Calendar } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CoupleCounter } from '@/components/features/couple-counter';
import type { DateEntry } from '@/types';

async function getRecentDates(coupleId: string): Promise<DateEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('dates')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
    .limit(3);
  return (data ?? []) as DateEntry[];
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date(dateStr));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Kiểm tra có couple chưa
  const { data: memberData, error: memberError } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (memberError) throw new Error('Không thể tải dữ liệu. Vui lòng thử lại.');
  if (!memberData) redirect('/couple/setup');

  let recentDates: DateEntry[] = [];
  try {
    recentDates = await getRecentDates(memberData.couple_id);
  } catch {
    // Silently fail — show empty list instead of crashing
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-text">Tổng quan 💕</h1>
        <p className="text-text-muted text-sm mt-1">Câu chuyện tình yêu của bạn hôm nay</p>
      </header>

      {/* Couple Counter — Client Component */}
      <CoupleCounter />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/dates/new"
          className="group flex items-center gap-4 p-4 rounded-[var(--radius-lg)] bg-surface border border-border hover:border-primary/40 hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={22} />
          </div>
          <div>
            <p className="font-semibold text-text">Ghi buổi hẹn mới</p>
            <p className="text-text-muted text-xs">Lưu lại kỷ niệm hôm nay</p>
          </div>
        </Link>

        <Link
          href="/dates"
          className="group flex items-center gap-4 p-4 rounded-[var(--radius-lg)] bg-surface border border-border hover:border-accent/40 hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calendar size={22} />
          </div>
          <div>
            <p className="font-semibold text-text">Xem tất cả buổi hẹn</p>
            <p className="text-text-muted text-xs">Nhìn lại hành trình yêu</p>
          </div>
        </Link>
      </div>

      {/* Recent Dates */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg text-text">Kỷ niệm gần đây</h2>
          {recentDates.length > 0 && (
            <Link href="/dates" className="text-primary text-sm font-medium hover:underline">Xem tất cả →</Link>
          )}
        </div>

        {recentDates.length === 0 ? (
          <div className="p-8 border border-dashed border-border rounded-[var(--radius-lg)] bg-surface/50 text-center">
            <p className="text-4xl mb-3">📖</p>
            <h3 className="font-medium text-text mb-1">Chưa có kỷ niệm nào</h3>
            <p className="text-sm text-text-muted mb-4">Hãy ghi lại buổi hẹn đầu tiên của bạn!</p>
            <Link
              href="/dates/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-primary text-primary-fg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={16} /> Thêm buổi hẹn
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentDates.map((date) => (
              <Link
                key={date.id}
                href={`/dates/${date.id}`}
                className="flex items-center gap-4 p-4 rounded-[var(--radius-lg)] bg-surface border border-border hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                {date.checkin_image_url ? (
                  <img
                    src={date.checkin_image_url}
                    alt={date.location_name ?? ''}
                    className="w-14 h-14 rounded-[var(--radius-md)] object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-[var(--radius-md)] bg-primary/10 flex items-center justify-center flex-shrink-0 text-2xl">
                    📍
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text truncate">{date.location_name ?? 'Không có địa điểm'}</p>
                  <p className="text-text-muted text-sm">{formatDateShort(date.date_time ?? date.created_at)}</p>
                </div>
                {date.rating && (
                  <div className="text-primary text-sm font-bold">{date.rating}⭐</div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
