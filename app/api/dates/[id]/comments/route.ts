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
  const json = await request.json();
  const bodyText = typeof json?.body === 'string' ? json.body.trim() : '';

  if (!bodyText) {
    return NextResponse.json({ error: 'Nội dung bình luận không được rỗng' }, { status: 400 });
  }

  if (bodyText.length > 500) {
    return NextResponse.json({ error: 'Bình luận tối đa 500 ký tự' }, { status: 400 });
  }

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

  const { data: comment, error: insertError } = await supabase
    .from('date_comments')
    .insert({
      date_id: dateId,
      author_id: user.id,
      body: bodyText,
    })
    .select('*, author:profiles(*)')
    .single();

  if (insertError) {
    console.error('insert comment error:', insertError);
    return NextResponse.json({ error: 'Không thể thêm bình luận' }, { status: 500 });
  }

  return NextResponse.json({ data: comment }, { status: 201 });
}
