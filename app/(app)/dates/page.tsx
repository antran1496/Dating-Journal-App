import React from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { DateEntry } from '@/types';

function formatDate(dateStr: string | null, endDateStr: string | null = null): string {
  if (!dateStr) return 'Chưa ghi nhận';
  const start = new Intl.DateTimeFormat('vi-VN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(dateStr));
  
  if (endDateStr) {
    const end = new Intl.DateTimeFormat('vi-VN', {
      day: 'numeric', month: 'short', year: 'numeric',
    }).format(new Date(endDateStr));
    return `${start} - ${end}`;
  }
  
  return start;
}

export const metadata = {
  title: 'Buổi hẹn hò | Dating Journal',
};

export default async function DatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: memberData } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!memberData) redirect('/couple/setup');

  const { data: dates } = await supabase
    .from('dates')
    .select('*')
    .eq('couple_id', memberData.couple_id)
    .order('date_time', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  const allDates = (dates ?? []) as DateEntry[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Buổi hẹn hò 📅</h1>
          <p className="text-text-muted text-sm mt-1">{allDates.length} kỷ niệm đã ghi lại</p>
        </div>
        <Link
          href="/dates/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] bg-primary text-primary-fg font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus size={18} /> Thêm mới
        </Link>
      </div>

      {allDates.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <p className="text-6xl mb-4">🌸</p>
          <h2 className="font-heading text-xl font-bold text-text mb-2">Chưa có buổi hẹn nào</h2>
          <p className="text-text-muted text-sm mb-6 max-w-sm">
            Hãy bắt đầu ghi lại những buổi hẹn hò để tạo nên câu chuyện tình yêu của riêng bạn!
          </p>
          <Link
            href="/dates/new"
            className="flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] bg-primary text-primary-fg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={18} /> Ghi buổi hẹn đầu tiên
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {allDates.map((date) => {
            const thumbnail = date.checkin_image_urls?.[0] ?? date.checkin_image_url;
            return (
              <Link
                key={date.id}
                href={`/dates/${date.id}`}
                className="group flex rounded-[var(--radius-lg)] bg-surface border border-border hover:border-primary/30 hover:shadow-[var(--shadow-card)] transition-all overflow-hidden p-3 gap-4"
              >
                <div className="shrink-0 w-24 h-20 rounded-[var(--radius-md)] overflow-hidden">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={date.location_name ?? ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-2xl">
                      📍
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <h3 className="font-semibold text-text truncate mb-0.5">
                    {date.location_name ?? 'Không có địa điểm'}
                  </h3>
                  <p className="text-text-muted text-xs mb-1.5">{formatDate(date.date_time ?? date.created_at, date.end_date)}</p>
                  
                  <div className="flex items-center gap-2 mt-auto">
                    {date.rating && (
                      <div className="flex gap-0.5 shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-[10px] ${i < date.rating! ? 'text-primary' : 'text-text-muted opacity-30'}`}>♥</span>
                        ))}
                      </div>
                    )}
                    {date.pros && (
                      <p className="text-xs text-text-muted truncate">
                        • {date.pros}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
