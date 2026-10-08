import 'server-only';
import crypto from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendMagicLinkEmail } from '@/lib/email/send';

const db = () => createAdminClient();

const EMAIL_WINDOW_MS = 15 * 60 * 1000; // 15 phút
const IP_WINDOW_MS = 60 * 60 * 1000;    // 1 giờ

async function getRecentAttempts(col: 'email' | 'ip', value: string, windowMs: number): Promise<number> {
  const { count } = await db()
    .from('auth_login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('kind', 'magic')
    .eq(col, value)
    .gte('created_at', new Date(Date.now() - windowMs).toISOString());
  return count ?? 0;
}

export async function requestMagicLink(emailRaw: string, ip: string | null): Promise<{ ok: boolean }> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { ok: true }; // Tránh rò rỉ trạng thái
  }

  // Rate limit: tối đa 3 lần/15 phút/email, 20 lần/giờ/IP
  const emailCount = await getRecentAttempts('email', email, EMAIL_WINDOW_MS);
  if (emailCount >= 3) {
    // Vẫn trả ok=true để không lộ email
    return { ok: true };
  }

  if (ip) {
    const ipCount = await getRecentAttempts('ip', ip, IP_WINDOW_MS);
    if (ipCount >= 20) {
      return { ok: true };
    }
  }

  // Sinh token ngẫu nhiên an toàn mật mã (64 ký tự hex)
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Lưu vào database
  const { error: insertErr } = await db().from('auth_login_tokens').insert({
    email,
    token_hash: tokenHash,
    expires_at: expiresAt,
    ip,
  });

  if (insertErr) {
    console.error('[requestMagicLink] DB error inserting token:', insertErr);
    return { ok: true };
  }

  // Ghi nhận attempt để rate limit
  await db().from('auth_login_attempts').insert({
    kind: 'magic',
    email,
    ip,
    success: true,
  });

  // Gửi email
  await sendMagicLinkEmail({ to: email, token });

  return { ok: true };
}

export async function consumeMagicToken(tokenRaw: string): Promise<{ id: string; email: string } | null> {
  const token = tokenRaw.trim();
  if (!token) return null;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const now = new Date().toISOString();

  // Tra cứu token chưa dùng và chưa hết hạn
  const { data: record, error: findErr } = await db()
    .from('auth_login_tokens')
    .select('id, email')
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', now)
    .maybeSingle();

  if (findErr || !record) {
    return null;
  }

  // Đánh dấu đã dùng ngay lập tức (dùng 1 lần)
  await db()
    .from('auth_login_tokens')
    .update({ used_at: now })
    .eq('id', record.id);

  const email = record.email.toLowerCase();

  // Tra cứu user
  const { data: existingUser } = await db()
    .from('auth_users')
    .select('id, email_verified_at')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    // Chống pre-hijack: nếu email chưa từng verified, xoá password_hash và set verified
    await db().from('auth_users').update(
      existingUser.email_verified_at
        ? { last_sign_in_at: now }
        : { password_hash: null, email_verified_at: now, last_sign_in_at: now }
    ).eq('id', existingUser.id);

    return { id: existingUser.id, email };
  }

  // Tạo user mới kèm profile
  const { data: newUser, error: createErr } = await db()
    .from('auth_users')
    .insert({
      email,
      email_verified_at: now,
      last_sign_in_at: now,
    })
    .select('id')
    .single();

  if (createErr || !newUser) {
    console.error('[consumeMagicToken] Create user error:', createErr);
    return null;
  }

  const displayName = email.split('@')[0];
  await db().from('profiles').upsert(
    { id: newUser.id, display_name: displayName },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  return { id: newUser.id, email };
}
