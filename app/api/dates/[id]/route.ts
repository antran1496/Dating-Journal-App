import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { z } from 'zod';

const updateDateSchema = z.object({
  location_name: z.string().min(1).optional(),
  date_time: z.string().optional(),
  end_date: z.string().optional(),
  pros: z.string().optional(),
  cons: z.string().optional(),
  wish_next_time: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  checkin_image_url: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<'/api/dates/[id]'>
) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const supabase = await createClient(user);

  const { data, error } = await supabase.from('dates').select('*').eq('id', id).single();
  if (error?.code === 'PGRST116') return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
  if (error) return NextResponse.json({ error: `Lỗi server: ${error.message}`, code: error.code }, { status: 500 });

  return NextResponse.json({ data });
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/dates/[id]'>
) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const supabase = await createClient(user);

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Request không hợp lệ' }, { status: 400 });
  }

  const parsed = updateDateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('dates').update(parsed.data).eq('id', id).select().single();

  if (error) return NextResponse.json({ error: `Không thể cập nhật: ${error.message}`, code: error.code }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<'/api/dates/[id]'>
) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const supabase = await createClient(user);

  const { error } = await supabase.from('dates').delete().eq('id', id);
  if (error) return NextResponse.json({ error: `Không thể xóa: ${error.message}`, code: error.code }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
