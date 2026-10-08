import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { revokeInvite } from '@/lib/invites';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const { id: inviteId } = await context.params;

    const admin = createAdminClient();
    const { data: member } = await admin
      .from('couple_members')
      .select('couple_id')
      .eq('profile_id', user.id)
      .is('left_at', null)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    }

    const success = await revokeInvite(inviteId, member.couple_id);

    return NextResponse.json({ ok: success });
  } catch (error) {
    console.error('[DELETE /api/invites/[id]] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'server_error', message: 'Không thể thu hồi lời mời' },
      { status: 500 }
    );
  }
}
