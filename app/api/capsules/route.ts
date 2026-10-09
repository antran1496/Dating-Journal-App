import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { isUnlockDateValid } from '@/lib/capsules/date';
import { z } from 'zod';

const createCapsuleSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề không được để trống').max(80, 'Tiêu đề tối đa 80 ký tự'),
  body: z.string().trim().min(1, 'Nội dung không được để trống').max(5000, 'Nội dung tối đa 5000 ký tự'),
  unlock_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày YYYY-MM-DD'),
  media_urls: z.array(z.string().url()).max(3, 'Tối đa 3 ảnh').optional().default([]),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const supabase = await createClient(user);
  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!member?.couple_id) {
    return NextResponse.json({ error: 'Bạn cần tạo couple trước' }, { status: 400 });
  }

  const { data: capsules, error } = await supabase.rpc('list_capsules', {
    p_couple_id: member.couple_id,
  });

  if (error) {
    console.error('[GET /api/capsules] RPC error:', error);
    return NextResponse.json({ error: 'Không thể tải danh sách time capsule' }, { status: 500 });
  }

  return NextResponse.json({ data: capsules || [] });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body không hợp lệ' }, { status: 400 });
  }

  const parsed = createCapsuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, body: contentBody, unlock_on, media_urls } = parsed.data;

  const dateCheck = isUnlockDateValid(unlock_on);
  if (!dateCheck.valid) {
    return NextResponse.json({ error: dateCheck.error }, { status: 400 });
  }

  const supabase = await createClient(user);
  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!member?.couple_id) {
    return NextResponse.json({ error: 'Bạn cần tạo couple trước' }, { status: 400 });
  }

  const { data: newCapsule, error } = await supabase
    .from('time_capsules')
    .insert({
      couple_id: member.couple_id,
      created_by: user.id,
      title,
      body: contentBody,
      unlock_on,
      media_urls,
    })
    .select('id, couple_id, title, unlock_on, created_at')
    .single();

  if (error || !newCapsule) {
    console.error('[POST /api/capsules] DB error:', error);
    return NextResponse.json({ error: 'Không thể tạo time capsule' }, { status: 500 });
  }

  return NextResponse.json({ data: newCapsule });
}
