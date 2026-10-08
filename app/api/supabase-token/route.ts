import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { mintSupabaseToken } from '@/lib/auth/supabase-token';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const { token, expiresAt } = await mintSupabaseToken(user.id);
  return NextResponse.json({ token, expiresAt }, { headers: { 'Cache-Control': 'private, no-store' } });
}
