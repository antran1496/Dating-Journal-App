'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { DateForm } from '@/components/features/date-form';
import type { DateFormValues } from '@/types/forms';

export default function NewDatePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const { data: coupleId } = useQuery({
    queryKey: ['couple-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('profile_id', user.id)
        .maybeSingle();
      return data?.couple_id ?? null;
    },
  });

  const handleSubmit = async (values: DateFormValues & { checkin_image_url?: string }) => {
    if (!coupleId) return;
    setError(null);

    const res = await fetch('/api/dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, couple_id: coupleId }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'Không thể tạo buổi hẹn');
      return;
    }

    router.push('/dates');
    router.refresh();
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dates" className="p-2 rounded-[var(--radius-md)] hover:bg-surface-hover transition-colors text-text-muted hover:text-text">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold text-text">Ghi buổi hẹn mới 💕</h1>
          <p className="text-text-muted text-sm">Lưu lại kỷ niệm của bạn</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 text-[var(--color-error)] text-sm">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-[var(--radius-lg)] border border-border p-6">
        <DateForm onSubmit={handleSubmit} onCancel={() => router.back()} />
      </div>
    </div>
  );
}
