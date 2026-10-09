import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { id: dateId } = await params;
  const supabase = await createClient(user);

  // Check date exists and user is couple member
  const { data: date, error: dateError } = await supabase
    .from('dates')
    .select('id, couple_id, created_by')
    .eq('id', dateId)
    .single();

  if (dateError || !date) {
    return NextResponse.json({ error: 'Không tìm thấy kỷ niệm' }, { status: 404 });
  }

  // Upsert date_views
  const { error: upsertError } = await supabase.from('date_views').upsert(
    {
      date_id: dateId,
      profile_id: user.id,
      seen_at: new Date().toISOString(),
    },
    { onConflict: 'date_id,profile_id' }
  );

  if (upsertError) {
    console.error('record view error:', upsertError);
    return NextResponse.json({ error: 'Không thể ghi nhận lượt xem' }, { status: 500 });
  }

  return NextResponse.json({ data: { seen: true } });
}
