import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { previewInvite } from '@/lib/invites';
import { JoinAcceptClient } from './join-accept-client';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface JoinPageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: 'Lời mời tham gia couple — Dating Journal',
  description: 'Tham gia không gian riêng tư của hai bạn trên Dating Journal.',
};

export default async function JoinTokenPage({ params }: JoinPageProps) {
  const { token } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=/join/${token}`);
  }

  // Kiểm tra onboarding của user
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('onboarded_at')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.onboarded_at) {
    redirect(`/onboarding?next=/join/${token}`);
  }

  // Kiểm tra xem user đã có couple chưa
  const { data: existingMember } = await admin
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .is('left_at', null)
    .maybeSingle();

  if (existingMember) {
    redirect('/dashboard');
  }

  const preview = await previewInvite(token);

  if (!preview.valid) {
    const errorText =
      preview.error === 'expired'
        ? 'Lời mời này đã hết hạn sau 48 giờ.'
        : preview.error === 'used'
        ? 'Lời mời này đã được sử dụng rồi.'
        : 'Liên kết lời mời không hợp lệ.';

    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4 font-body">
        <div className="w-full max-w-md rounded-[28px] border border-border bg-surface p-8 sm:p-10 shadow-[var(--shadow-elevated)] text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text mb-2">Không thể tham gia</h1>
          <p className="text-sm text-text-muted mb-6 leading-relaxed">{errorText}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-primary text-primary-fg font-medium text-sm hover:bg-primary-hover shadow-sm transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // Tính số giờ còn lại
  let hoursLeft = 48;
  if (preview.expires_at) {
    const diff = new Date(preview.expires_at).getTime() - Date.now();
    hoursLeft = Math.max(1, Math.round(diff / (1000 * 60 * 60)));
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 font-body">
      <JoinAcceptClient
        token={token}
        inviterName={preview.inviter_name || 'Người ấy'}
        inviterAvatar={preview.inviter_avatar}
        message={preview.message}
        hoursLeft={hoursLeft}
      />
    </div>
  );
}
