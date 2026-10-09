import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function POST(_request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const supabase = await createClient(user);

  // Get couple membership
  const { data: member, error: memberErr } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (memberErr || !member?.couple_id) {
    return NextResponse.json({ error: 'Bạn chưa tham gia không gian nào' }, { status: 404 });
  }

  const coupleId = member.couple_id;
  const now = new Date();
  const purgeAfter = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // 1. Mark member as left
  const { error: updateMemberErr } = await supabase
    .from('couple_members')
    .update({ left_at: now.toISOString() })
    .eq('profile_id', user.id)
    .eq('couple_id', coupleId);

  if (updateMemberErr) {
    console.error('Update left_at error:', updateMemberErr);
    return NextResponse.json({ error: 'Không thể rời couple' }, { status: 500 });
  }

  // 2. Mark couple as dissolved with 30-day purge period
  const { error: updateCoupleErr } = await supabase
    .from('couples')
    .update({
      dissolved_at: now.toISOString(),
      purge_after: purgeAfter.toISOString(),
    })
    .eq('id', coupleId);

  if (updateCoupleErr) {
    console.error('Update dissolved_at error:', updateCoupleErr);
    return NextResponse.json({ error: 'Không thể cập nhật trạng thái couple' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    dissolved_at: now.toISOString(),
    purge_after: purgeAfter.toISOString(),
  });
}
