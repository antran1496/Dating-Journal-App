import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { getActiveInvite } from '@/lib/invites';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: member } = await admin
      .from('couple_members')
      .select('couple_id')
      .eq('profile_id', user.id)
      .is('left_at', null)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ ok: true, invite: null, member_count: 0 });
    }

    // Đếm số lượng thành viên trong couple để UI biết khi người kia đã tham gia
    const { count: memberCount } = await admin
      .from('couple_members')
      .select('profile_id', { count: 'exact', head: true })
      .eq('couple_id', member.couple_id)
      .is('left_at', null);

    const invite = await getActiveInvite(member.couple_id);

    return NextResponse.json({
      ok: true,
      invite,
      member_count: memberCount ?? 1,
    });
  } catch (error) {
    console.error('[GET /api/invites/active] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'server_error', message: 'Không thể lấy thông tin lời mời' },
      { status: 500 }
    );
  }
}
