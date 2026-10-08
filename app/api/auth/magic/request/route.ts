import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requestMagicLink } from '@/lib/auth/magic';

const requestSchema = z.object({
  email: z.string().trim().email('Email không đúng định dạng'),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    await requestMagicLink(parsed.data.email, ip);

    return NextResponse.json({
      ok: true,
      message: 'Mình đã gửi link vào email. Mở link để vào app nhé ✨ (hiệu lực 15 phút)',
    });
  } catch (error) {
    console.error('[API /api/auth/magic/request] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Đã xảy ra lỗi khi gửi link đăng nhập' },
      { status: 500 }
    );
  }
}
