import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const supabase = await createClient(user);

  // Get user couple
  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!member?.couple_id) {
    return NextResponse.json({ error: 'Chưa tham gia couple' }, { status: 404 });
  }

  const { data: items, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('couple_id', member.couple_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('get wishlist error:', error);
    return NextResponse.json({ error: 'Không thể tải danh sách' }, { status: 500 });
  }

  return NextResponse.json({ data: items || [] });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const json = await request.json().catch(() => ({}));
  const title = typeof json?.title === 'string' ? json.title.trim() : '';

  if (!title) {
    return NextResponse.json({ error: 'Tên điều muốn thử không được để trống' }, { status: 400 });
  }

  if (title.length > 120) {
    return NextResponse.json({ error: 'Tên tối đa 120 ký tự' }, { status: 400 });
  }

  const note = typeof json?.note === 'string' ? json.note.trim() : null;
  const budgetVnd = typeof json?.budget_vnd === 'number' ? json.budget_vnd : null;

  const supabase = await createClient(user);

  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!member?.couple_id) {
    return NextResponse.json({ error: 'Chưa tham gia couple' }, { status: 404 });
  }

  const { data: item, error: insertError } = await supabase
    .from('wishlist_items')
    .insert({
      couple_id: member.couple_id,
      title,
      note,
      budget_vnd: budgetVnd,
      created_by: user.id,
    })
    .select('*')
    .single();

  if (insertError) {
    console.error('insert wishlist error:', insertError);
    return NextResponse.json({ error: 'Không thể thêm mục' }, { status: 500 });
  }

  return NextResponse.json({ data: item }, { status: 201 });
}
