import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Transform empty strings to undefined so Postgres doesn't receive "" for timestamp columns
const emptyToUndefined = z.string().optional().transform((v) => (v === '' ? undefined : v));

const createDateSchema = z.object({
  couple_id: z.string().uuid(),
  location_name: z.string().min(1, 'Vui lòng nhập địa điểm'),
  date_time: emptyToUndefined,
  end_date: emptyToUndefined,
  pros: emptyToUndefined,
  cons: emptyToUndefined,
  wish_next_time: emptyToUndefined,
  rating: z.coerce.number().min(1).max(5).optional().nullable(),
  checkin_image_url: emptyToUndefined,
  checkin_image_urls: z.array(z.string()).max(9).optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const user = session?.user;
  if (sessionError || !user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const coupleId = request.nextUrl.searchParams.get('couple_id');
  if (!coupleId) return NextResponse.json({ error: 'Thiếu couple_id' }, { status: 400 });

  const pageParam = request.nextUrl.searchParams.get('page');
  const limitParam = request.nextUrl.searchParams.get('limit');

  const query = supabase
    .from('dates')
    .select('*', { count: 'exact' })
    .eq('couple_id', coupleId)
    .order('date_time', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (pageParam || limitParam) {
    const page = Math.max(1, parseInt(pageParam || '1', 10));
    const limit = Math.max(1, parseInt(limitParam || '20', 10));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query.range(from, to);

    if (error) {
      console.error('[GET /api/dates]', error);
      return NextResponse.json(
        { error: `Không thể tải dữ liệu: ${error.message}`, code: error.code, details: error.details },
        { status: 500 },
      );
    }

    const total = count ?? 0;
    return NextResponse.json({
      data: data ?? [],
      total,
      page,
      limit,
      hasMore: from + (data?.length ?? 0) < total,
    });
  }

  const { data, error } = await query;

  if (error) {
    console.error('[GET /api/dates]', error);
    return NextResponse.json(
      { error: `Không thể tải dữ liệu: ${error.message}`, code: error.code, details: error.details },
      { status: 500 },
    );
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

  // Remove undefined keys so Supabase uses column defaults
  const insertPayload = Object.fromEntries(
    Object.entries({ ...parsed.data, created_by: user.id }).filter(([, v]) => v !== undefined),
  );

  const { data, error } = await supabase
    .from('dates')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('[POST /api/dates]', error);
    return NextResponse.json(
      { error: `Không thể tạo buổi hẹn: ${error.message}`, code: error.code, details: error.details },
      { status: 500 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
