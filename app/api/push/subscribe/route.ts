import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  ua: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const json = await request.json().catch(() => ({}));
  const parse = subscriptionSchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: 'Dữ liệu đăng ký không hợp lệ' }, { status: 400 });
  }

  const { endpoint, keys, ua } = parse.data;
  const supabase = await createClient(user);

  // Upsert subscription
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      profile_id: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      ua: ua || request.headers.get('user-agent') || null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );

  if (error) {
    console.error('Save push subscription error:', error);
    return NextResponse.json({ error: 'Không thể lưu đăng ký thông báo' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const json = await request.json().catch(() => ({}));
  const endpoint = typeof json?.endpoint === 'string' ? json.endpoint : '';

  if (!endpoint) {
    return NextResponse.json({ error: 'Thiếu endpoint' }, { status: 400 });
  }

  const supabase = await createClient(user);
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('profile_id', user.id)
    .eq('endpoint', endpoint);

  if (error) {
    console.error('Delete push subscription error:', error);
    return NextResponse.json({ error: 'Không thể huỷ đăng ký' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
