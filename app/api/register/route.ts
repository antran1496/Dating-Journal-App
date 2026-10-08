import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EmailTakenError, RateLimitedError, registerUser } from '@/lib/auth/users';

export const runtime = 'nodejs';

const schema = z.object({
  display_name: z.string().trim().min(2).max(60),
  email: z.string().email().max(254),
  password: z.string().min(6).refine((p) => new TextEncoder().encode(p).length <= 72, 'too long'), // giới hạn bcrypt
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: 'invalid_input' }, { status: 400 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  try {
    await registerUser({ email: parsed.data.email, password: parsed.data.password, displayName: parsed.data.display_name }, ip);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    if (e instanceof EmailTakenError) return NextResponse.json({ code: 'email_taken' }, { status: 409 });
    if (e instanceof RateLimitedError) return NextResponse.json({ code: 'rate_limited' }, { status: 429 });
    console.error('[POST /api/register]', e);
    return NextResponse.json({ code: 'server_error' }, { status: 500 });
  }
}
