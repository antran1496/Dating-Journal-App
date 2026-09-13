import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createDateSchema = z.object({
  couple_id: z.string().uuid(),
  location_name: z.string().min(1, 'Vui lòng nhập địa điểm'),
  date_time: z.string().optional(),
  pros: z.string().optional(),
  cons: z.string().optional(),
  wish_next_time: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  checkin_image_url: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const coupleId = request.nextUrl.searchParams.get('couple_id');
  if (!coupleId) return NextResponse.json({ error: 'Thiếu couple_id' }, { status: 400 });

  const { data, error } = await supabase
    .from('dates')
    .select('*')
    .eq('couple_id', coupleId)
    .order('date_time', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /api/dates]', error);
    return NextResponse.json({ error: 'Không thể tải dữ liệu' }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Request không hợp lệ' }, { status: 400 });
  }

  const parsed = createDateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('dates')
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single();

  if (error) {
    console.error('[POST /api/dates]', error);
    return NextResponse.json({ error: 'Không thể tạo buổi hẹn' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
