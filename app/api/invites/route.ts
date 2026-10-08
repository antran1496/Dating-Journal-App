import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { createInvite } from '@/lib/invites';

const createSchema = z.object({
  message: z.string().max(140, 'Lời nhắn tối đa 140 ký tự').optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    // Lấy couple_id của user
    const { data: member } = await admin
      .from('couple_members')
      .select('couple_id')
      .eq('profile_id', user.id)
      .is('left_at', null)
      .maybeSingle();

    if (!member) {
      return NextResponse.json(
        { ok: false, error: 'no_couple', message: 'Bạn chưa tạo không gian cặp đôi' },
        { status: 400 }
      );
    }

    const json = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'invalid_input', message: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const invite = await createInvite(member.couple_id, user.id, parsed.data.message);
    return NextResponse.json({ ok: true, invite });
  } catch (error) {
    console.error('[POST /api/invites] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'server_error', message: 'Không thể tạo mã mời' },
      { status: 500 }
    );
  }
}
