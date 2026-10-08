import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { differenceInYears, parseISO } from 'date-fns';
import { todayVN } from '@/lib/time';

const onboardSchema = z.object({
  display_name: z.string().trim().min(1, 'Vui lòng nhập tên hiển thị').max(50, 'Tên quá dài'),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh không hợp lệ'),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Bạn cần đồng ý lưu trữ riêng tư để tiếp tục' }),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const parsed = onboardSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'invalid_input', message: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { display_name, birth_date, primary_color } = parsed.data;

    // Validate tuổi >= 16 theo ngày hiện tại ở Việt Nam
    const birthDateObj = parseISO(birth_date);
    const today = parseISO(todayVN());
    const age = differenceInYears(today, birthDateObj);

    if (age < 16) {
      return NextResponse.json(
        {
          ok: false,
          error: 'underage',
          message: 'Dating Journal chỉ dành cho người từ đủ 16 tuổi trở lên.',
        },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    // 1. Cập nhật profile
    const { error: pErr } = await admin
      .from('profiles')
      .update({
        display_name,
        birth_date,
        onboarded_at: now,
        consent_at: now,
        consent_version: 'v2',
      })
      .eq('id', user.id);

    if (pErr) {
      console.error('[POST /api/profile/onboard] Profile update error:', pErr);
      return NextResponse.json(
        { ok: false, error: 'db_error', message: 'Không thể lưu thông tin hồ sơ' },
        { status: 500 }
      );
    }

    // 2. Cập nhật màu chủ đạo nếu có
    if (primary_color) {
      await admin.from('user_preferences').upsert(
        {
          profile_id: user.id,
          primary_color,
        },
        { onConflict: 'profile_id' }
      );
    }

    return NextResponse.json({ ok: true, message: 'Hoàn tất thông tin làm quen' });
  } catch (error) {
    console.error('[POST /api/profile/onboard] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: 'server_error', message: 'Đã xảy ra lỗi máy chủ' },
      { status: 500 }
    );
  }
}
