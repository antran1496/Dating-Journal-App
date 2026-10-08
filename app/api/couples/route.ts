import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { z } from 'zod';

const createCoupleSchema = z.object({
  anniversary_date: z.string().min(1),
  relationship_status: z.enum(['talking', 'dating', 'official', 'engaged', 'married']).default('dating'),
});

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const supabase = await createClient(user);

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

  const parsed = createCoupleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 });
  }

  // Tạo invite code unique
  let invite_code = generateInviteCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await supabase.from('couples').select('id').eq('invite_code', invite_code).maybeSingle();
    if (!existing) break;
    invite_code = generateInviteCode();
    attempts++;
  }

  // Tạo couple
  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .insert({ ...parsed.data, invite_code, created_by: user.id })
    .select()
    .single();

  if (coupleError) {
    console.error('[POST /api/couples]', coupleError);
    return NextResponse.json({ error: 'Không thể tạo couple: ' + coupleError.message, details: coupleError }, { status: 500 });
  }

  // Thêm creator vào couple_members
  const { error: memberError } = await supabase.from('couple_members').insert({
    couple_id: couple.id,
    profile_id: user.id,
    role: 'creator',
  });

  if (memberError) {
    console.error('[POST /api/couples] member insert error', memberError);
    return NextResponse.json({ error: 'Không thể thêm thành viên: ' + memberError.message }, { status: 500 });
  }

  return NextResponse.json({ data: couple }, { status: 201 });
}
