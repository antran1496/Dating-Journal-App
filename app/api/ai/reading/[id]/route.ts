import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { z } from 'zod';

const updateSchema = z.object({
  shared_with_partner: z.boolean(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Thiếu ID luận giải' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body không hợp lệ' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient(user);
  const { data, error } = await supabase
    .from('ai_readings')
    .update({ shared_with_partner: parsed.data.shared_with_partner })
    .eq('id', id)
    .eq('profile_id', user.id)
    .select()
    .single();

  if (error || !data) {
    console.error('[PATCH /api/ai/reading/[id]] DB error:', error);
    return NextResponse.json({ error: 'Không thể cập nhật trạng thái chia sẻ' }, { status: 500 });
  }

  return NextResponse.json({ data });
}
