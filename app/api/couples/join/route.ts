import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const joinSchema = z.object({
  invite_code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  // Kiểm tra đã có couple chưa
  const { data: existing } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Bạn đã có người yêu rồi 💕' }, { status: 409 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Request không hợp lệ' }, { status: 400 });
  }

  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Mã mời không hợp lệ' }, { status: 400 });
  }

  // Dùng admin client để bypass RLS — Partner B chưa là thành viên
  // nên RLS chặn không cho đọc bảng couples
  const adminSupabase = createAdminClient();

  // Tìm couple bằng invite code
  const { data: couple, error: findError } = await adminSupabase
    .from('couples')
    .select('id, created_by')
    .eq('invite_code', parsed.data.invite_code.toUpperCase())
    .maybeSingle();

  if (findError || !couple) {
    return NextResponse.json({ error: 'Mã mời không tồn tại hoặc đã hết hiệu lực' }, { status: 404 });
  }

  // Không được join couple của chính mình
  if (couple.created_by === user.id) {
    return NextResponse.json({ error: 'Bạn không thể tự mời chính mình 😄' }, { status: 400 });
  }

  // Kiểm tra couple đã đủ 2 người chưa (cũng cần admin để bypass RLS)
  const { count } = await adminSupabase
    .from('couple_members')
    .select('*', { count: 'exact', head: true })
    .eq('couple_id', couple.id);

  if ((count ?? 0) >= 2) {
    return NextResponse.json({ error: 'Couple này đã đủ 2 người rồi 💑' }, { status: 409 });
  }

  // Join couple — dùng client user để RLS insert policy kiểm tra profile_id = auth.uid()
  const { error: memberError } = await supabase.from('couple_members').insert({
    couple_id: couple.id,
    profile_id: user.id,
    role: 'member',
  });

  if (memberError) {
    console.error('[POST /api/couples/join]', memberError);
    return NextResponse.json({ error: 'Không thể tham gia couple' }, { status: 500 });
  }

  return NextResponse.json({ data: { couple_id: couple.id } }, { status: 200 });
}
