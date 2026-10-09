import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const deleteAccountSchema = z.object({
  confirmation: z.literal('XOATAIKHOAN', {
    errorMap: () => ({ message: 'Vui lòng nhập đúng từ xác nhận "XOATAIKHOAN"' }),
  }),
});

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const json = await request.json().catch(() => ({}));
  const parse = deleteAccountSchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json(
      { error: parse.error.errors[0]?.message || 'Xác nhận không hợp lệ' },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  try {
    // 1. Delete personal AI readings
    await adminClient.from('ai_readings').delete().eq('profile_id', user.id);

    // 2. Delete personal daily answers
    await adminClient.from('daily_answers').delete().eq('profile_id', user.id);

    // 3. Mark or remove couple membership (D8: leave couple)
    const { data: member } = await adminClient
      .from('couple_members')
      .select('couple_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (member?.couple_id) {
      await adminClient
        .from('couple_members')
        .update({ left_at: new Date().toISOString() })
        .eq('profile_id', user.id);
    }

    // 4. Delete auth account credentials & auth_user (cascades to profile)
    await adminClient.from('auth_accounts').delete().eq('user_id', user.id);
    await adminClient.from('auth_users').delete().eq('id', user.id);

    // Return response instructing cookie cleanup
    const res = NextResponse.json({ success: true });
    res.cookies.delete('authjs.session-token');
    res.cookies.delete('__Secure-authjs.session-token');

    return res;
  } catch (err) {
    console.error('Delete account error:', err);
    return NextResponse.json({ error: 'Không thể xoá tài khoản lúc này' }, { status: 500 });
  }
}
