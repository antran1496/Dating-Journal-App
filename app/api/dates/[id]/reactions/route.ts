import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
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
    .select('id, couple_id')
    .eq('id', dateId)
    .single();

  if (dateError || !date) {
    return NextResponse.json({ error: 'Không tìm thấy kỷ niệm' }, { status: 404 });
  }

  let emoji = '💗';
  try {
    const body = await request.json();
    if (body.emoji && typeof body.emoji === 'string') {
      emoji = body.emoji.trim();
    }
  } catch {
    // Body optional, fallback to '💗'
  }

  // Check existing reaction
  const { data: existing } = await supabase
    .from('date_reactions')
    .select('emoji')
    .eq('date_id', dateId)
    .eq('profile_id', user.id)
    .maybeSingle();

  if (existing) {
    if (existing.emoji === emoji) {
      // Toggle off
      await supabase
        .from('date_reactions')
        .delete()
        .eq('date_id', dateId)
        .eq('profile_id', user.id);

      return NextResponse.json({ data: { reacted: false, emoji: null } });
    } else {
      // Update emoji
      await supabase
        .from('date_reactions')
        .update({ emoji })
        .eq('date_id', dateId)
        .eq('profile_id', user.id);

      return NextResponse.json({ data: { reacted: true, emoji } });
    }
  }

  // Insert reaction
  const { error: insertError } = await supabase.from('date_reactions').insert({
    date_id: dateId,
    profile_id: user.id,
    emoji,
  });

  if (insertError) {
    console.error('insert reaction error:', insertError);
    return NextResponse.json({ error: 'Không thể thả tim' }, { status: 500 });
  }

  return NextResponse.json({ data: { reacted: true, emoji } });
}
