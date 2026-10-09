import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { toShareable, RawWrappedData } from '@/lib/wrapped/sanitize';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '2026';
  const includeSpend = searchParams.get('spend') === 'true';

  const supabase = await createClient(user);
  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!member?.couple_id) {
    return NextResponse.json({ error: 'Bạn cần tạo couple trước khi xem Wrapped' }, { status: 400 });
  }

  const { data: rawWrapped, error } = await supabase.rpc('get_wrapped', {
    p_couple_id: member.couple_id,
    p_period: period,
  });

  if (error || !rawWrapped) {
    console.error('[GET /api/wrapped] RPC error:', error);
    return NextResponse.json({ error: 'Không thể tải dữ liệu Wrapped' }, { status: 500 });
  }

  const shareable = toShareable(rawWrapped as unknown as RawWrappedData, { includeSpend });

  return NextResponse.json({
    data: {
      raw: rawWrapped,
      shareable,
    },
  });
}
