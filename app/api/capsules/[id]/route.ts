import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Thiếu ID capsule' }, { status: 400 });

  const supabase = await createClient(user);
  const { error } = await supabase
    .from('time_capsules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[DELETE /api/capsules/[id]] DB error:', error);
    return NextResponse.json({ error: 'Không thể xoá time capsule (chỉ người tạo mới được xoá trước khi mở)' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
