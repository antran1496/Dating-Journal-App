import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Edit3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { DateEntry } from '@/types';

export default async function DateDetailPage(props: PageProps<'/dates/[id]'>) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: date, error } = await supabase
    .from('dates')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !date) notFound();

  const entry = date as DateEntry;

  const formattedDate = entry.date_time
    ? new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(entry.date_time))
    : new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(entry.created_at));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/dates" className="flex items-center gap-2 text-text-muted hover:text-text transition-colors text-sm">
          <ArrowLeft size={18} /> Quay lại
        </Link>
        <Link
          href={`/dates/${id}/edit`}
          className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border border-border hover:bg-surface-hover transition-colors text-sm font-medium text-text"
        >
          <Edit3 size={16} /> Chỉnh sửa
        </Link>
      </div>

      {/* Hero Image */}
      {entry.checkin_image_url && (
        <div className="rounded-[var(--radius-lg)] overflow-hidden mb-6">
          <img
            src={entry.checkin_image_url}
            alt={entry.location_name ?? 'Check-in'}
            className="w-full max-h-80 object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-text mb-2">
          {entry.location_name ?? 'Không có địa điểm'}
        </h1>
        <div className="flex items-center gap-4 text-text-muted text-sm flex-wrap">
          <span className="flex items-center gap-1.5">
            <Calendar size={15} /> {formattedDate}
          </span>
          {entry.rating && (
            <span className="flex items-center gap-1">
              {Array.from({ length: entry.rating }).map((_, i) => (
                <span key={i} className="text-primary">♥</span>
              ))}
              {Array.from({ length: 5 - entry.rating }).map((_, i) => (
                <span key={i} className="text-text-muted opacity-30">♥</span>
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Content sections */}
      <div className="space-y-5">
        {entry.pros && (
          <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-success)]/5 border border-[var(--color-success)]/20">
            <h2 className="font-semibold text-text text-sm mb-2 flex items-center gap-2">
              <span className="text-base">✅</span> Điểm hay
            </h2>
            <p className="text-text text-sm whitespace-pre-wrap">{entry.pros}</p>
          </div>
        )}

        {entry.cons && (
          <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-warning)]/5 border border-[var(--color-warning)]/20">
            <h2 className="font-semibold text-text text-sm mb-2 flex items-center gap-2">
              <span className="text-base">🔧</span> Cần cải thiện
            </h2>
            <p className="text-text text-sm whitespace-pre-wrap">{entry.cons}</p>
          </div>
        )}

        {entry.wish_next_time && (
          <div className="p-4 rounded-[var(--radius-lg)] bg-primary/5 border border-primary/20">
            <h2 className="font-semibold text-text text-sm mb-2 flex items-center gap-2">
              <span className="text-base">💭</span> Muốn thử lần sau
            </h2>
            <p className="text-text text-sm whitespace-pre-wrap">{entry.wish_next_time}</p>
          </div>
        )}
      </div>
    </div>
  );
}
