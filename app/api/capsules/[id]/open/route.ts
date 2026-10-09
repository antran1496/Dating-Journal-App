import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Thiếu ID capsule' }, { status: 400 });

  const supabase = await createClient(user);
  const { data, error } = await supabase.rpc('open_capsule', {
    p_capsule_id: id,
  });

  if (error || !data) {
    console.error('[POST /api/capsules/[id]/open] RPC error:', error);
    return NextResponse.json(
      { error: error?.message || 'Không thể mở time capsule (vẫn chưa tới ngày mở khóa)' },
      { status: 400 }
    );
  }

  return NextResponse.json({ data });
}
