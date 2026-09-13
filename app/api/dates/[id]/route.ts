import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateDateSchema = z.object({
  location_name: z.string().min(1).optional(),
  date_time: z.string().optional(),
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const { data, error } = await supabase.from('dates').select('*').eq('id', id).single();
  if (error?.code === 'PGRST116') return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
  if (error) return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });

  return NextResponse.json({ data });
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/dates/[id]'>
) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

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

  if (error) return NextResponse.json({ error: 'Không thể cập nhật' }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<'/api/dates/[id]'>
) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const { error } = await supabase.from('dates').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Không thể xóa' }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
