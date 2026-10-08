import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { redeemInvite } from '@/lib/invites';

const redeemSchema = z
  .object({
    token: z.string().optional(),
    code: z.string().optional(),
  })
  .refine((data) => !!data.token || !!data.code, {
    message: 'Cần cung cấp link hoặc mã mời để tham gia',
  });

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = redeemSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'invalid_input', message: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const result = await redeemInvite(user.id, parsed.data, ip);

    if (!result.ok) {
      const status = result.statusCode || 400;
      return NextResponse.json(
        { ok: false, error: result.error, message: result.message },
        { status }
      );
    }

    return NextResponse.json({
      ok: true,
      couple_id: result.couple_id,
      message: 'Chúc mừng hai bạn đã kết nối thành công! 💕',
    });
  } catch (error) {
    console.error('[POST /api/invites/redeem] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'server_error', message: 'Không thể xử lý yêu cầu tham gia' },
      { status: 500 }
    );
  }
}
