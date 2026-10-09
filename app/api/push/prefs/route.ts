import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const prefsUpdateSchema = z.object({
  reactions: z.boolean().optional(),
  weekend_reminder: z.boolean().optional(),
  daily_question: z.boolean().optional(),
  milestones: z.boolean().optional(),
  on_this_day: z.boolean().optional(),
  quiet_enabled: z.boolean().optional(),
  quiet_start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  quiet_end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
});

const DEFAULT_PREFS = {
  reactions: true,
  weekend_reminder: true,
  daily_question: true,
  milestones: true,
  on_this_day: true,
  quiet_enabled: false,
  quiet_start: '22:00',
  quiet_end: '07:00',
};

export async function GET(_request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const supabase = await createClient(user);
  const { data: prefs, error } = await supabase
    .from('notification_prefs')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Fetch notification prefs error:', error);
    return NextResponse.json({ error: 'Không thể tải cài đặt' }, { status: 500 });
  }

  return NextResponse.json({
    data: prefs || { ...DEFAULT_PREFS, profile_id: user.id },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const json = await request.json().catch(() => ({}));
  const parse = prefsUpdateSchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }

  const supabase = await createClient(user);
  const payload = {
    profile_id: user.id,
    ...parse.data,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('notification_prefs')
    .upsert(payload, { onConflict: 'profile_id' })
    .select()
    .single();

  if (error) {
    console.error('Update notification prefs error:', error);
    return NextResponse.json({ error: 'Không thể cập nhật cài đặt' }, { status: 500 });
  }

  return NextResponse.json({ data });
}
