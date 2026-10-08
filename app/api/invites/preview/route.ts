import { NextRequest, NextResponse } from 'next/server';
import { previewInvite } from '@/lib/invites';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'missing_token', message: 'Thiếu mã token lời mời' },
        { status: 400 }
      );
    }

    const preview = await previewInvite(token);

    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    console.error('[GET /api/invites/preview] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'server_error', message: 'Lỗi khi kiểm tra lời mời' },
      { status: 500 }
    );
  }
}
