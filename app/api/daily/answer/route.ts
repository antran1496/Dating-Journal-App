import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const json = await request.json().catch(() => ({}));
  const bodyText = typeof json?.body === 'string' ? json.body.trim() : '';

  if (!bodyText) {
    return NextResponse.json({ error: 'Câu trả lời không được để trống' }, { status: 400 });
  }

  if (bodyText.length > 300) {
    return NextResponse.json({ error: 'Câu trả lời tối đa 300 ký tự' }, { status: 400 });
  }

  const supabase = await createClient(user);

  // 1. Get user's couple
  const { data: member, error: memberError } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (memberError || !member?.couple_id) {
    return NextResponse.json({ error: 'Chưa tham gia couple' }, { status: 404 });
  }

  const coupleId = member.couple_id;

  // 2. Vietnam today date
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  // 3. Check if partner already answered (cannot edit if partner answered)
  const { data: partnerAnswer } = await supabase
    .from('daily_answers')
    .select('profile_id')
    .eq('couple_id', coupleId)
    .eq('day', todayStr)
    .neq('profile_id', user.id)
    .maybeSingle();

  const { data: existingAnswer } = await supabase
    .from('daily_answers')
    .select('profile_id')
    .eq('couple_id', coupleId)
    .eq('day', todayStr)
    .eq('profile_id', user.id)
    .maybeSingle();

  if (existingAnswer && partnerAnswer) {
    return NextResponse.json(
      { error: 'Không thể chỉnh sửa sau khi người ấy đã trả lời' },
      { status: 400 }
    );
  }

  // 4. Upsert answer
  const { data: saved, error: saveError } = await supabase
    .from('daily_answers')
    .upsert(
      {
        couple_id: coupleId,
        day: todayStr,
        profile_id: user.id,
        body: bodyText,
        answered_at: new Date().toISOString(),
      },
      { onConflict: 'couple_id,day,profile_id' }
    )
    .select('*, profile:profiles(*)')
    .single();

  if (saveError) {
    console.error('save daily answer error:', saveError);
    return NextResponse.json({ error: 'Không thể lưu câu trả lời' }, { status: 500 });
  }

  return NextResponse.json({ data: saved });
}
