import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { DUMMY_HASH, hashPassword, verifyPassword } from './password';

export class RateLimitedError extends Error {}
export class EmailTakenError extends Error {}

const db = () => createAdminClient();
const WINDOW_MS = 15 * 60 * 1000;

async function failures(kind: 'login' | 'register', col: 'email' | 'ip', value: string, windowMs: number) {
  const { count } = await db()
    .from('auth_login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('kind', kind).eq(col, value).eq('success', false)
    .gte('created_at', new Date(Date.now() - windowMs).toISOString());
  return count ?? 0;
}

async function record(kind: 'login' | 'register', email: string | null, ip: string | null, success: boolean) {
  await db().from('auth_login_attempts').insert({ kind, email, ip, success });
  if (Math.random() < 0.02) {
    await db().from('auth_login_attempts').delete().lt('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString());
  }
}

/** Trả về user hoặc null. Ném RateLimitedError nếu quá giới hạn. */
export async function authenticateWithPassword(emailRaw: string, password: string, ip: string | null) {
  const email = emailRaw.trim().toLowerCase();
  if ((await failures('login', 'email', email, WINDOW_MS)) >= 5) throw new RateLimitedError();
  if (ip && (await failures('login', 'ip', ip, WINDOW_MS)) >= 30) throw new RateLimitedError();

  const { data: user } = await db().from('auth_users').select('id, password_hash').eq('email', email).maybeSingle();
  const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  const success = !!user?.password_hash && ok;
  await record('login', email, ip, success);
  if (!success || !user) return null;

  await db().from('auth_users').update({ last_sign_in_at: new Date().toISOString() }).eq('id', user.id);
  return { id: user.id as string, email };
}

export async function registerUser(input: { email: string; password: string; displayName: string }, ip: string | null) {
  const email = input.email.trim().toLowerCase();
  if (ip && (await failures('register', 'ip', ip, 60 * 60 * 1000)) >= 10) throw new RateLimitedError();
  // Mọi lần gọi đều ghi nhận (success=false) để giới hạn spam; đánh dấu success khi tạo xong
  const password_hash = await hashPassword(input.password);
  const { data: user, error } = await db().from('auth_users').insert({ email, password_hash }).select('id').single();
  if (error?.code === '23505') { await record('register', email, ip, false); throw new EmailTakenError(); }
  if (error || !user) throw error ?? new Error('register failed');

  const { error: pErr } = await db().from('profiles').insert({ id: user.id, display_name: input.displayName.trim() });
  if (pErr) { await db().from('auth_users').delete().eq('id', user.id); throw pErr; } // rollback thủ công
  await record('register', email, ip, true);
  return { id: user.id as string };
}

type GoogleProfile = { sub: string; email: string; name?: string | null; picture?: string | null };

/** Tìm theo sub → liên kết theo email → tạo mới. Gọi lúc đăng nhập Google. Trả {id}. */
export async function upsertGoogleUser(p: GoogleProfile, retry = true): Promise<{ id: string }> {
  const email = p.email.toLowerCase();
  const now = new Date().toISOString();

  const { data: acc } = await db().from('auth_accounts').select('user_id')
    .eq('provider', 'google').eq('provider_account_id', p.sub).maybeSingle();
  if (acc) {
    await db().from('auth_users').update({ last_sign_in_at: now }).eq('id', acc.user_id);
    return { id: acc.user_id };
  }

  const { data: existing } = await db().from('auth_users').select('id, email_verified_at').eq('email', email).maybeSingle();
  if (existing) {
    const { error } = await db().from('auth_accounts').insert({ provider: 'google', provider_account_id: p.sub, user_id: existing.id });
    if (error && error.code !== '23505') throw error;
    // Chống "pre-hijack": nếu email chưa từng được xác thực, mật khẩu đăng ký trước đó có thể do kẻ khác đặt → xoá
    await db().from('auth_users').update(
      existing.email_verified_at
        ? { last_sign_in_at: now }
        : { password_hash: null, email_verified_at: now, last_sign_in_at: now },
    ).eq('id', existing.id);
    return { id: existing.id };
  }

  const { data: created, error: cErr } = await db().from('auth_users')
    .insert({ email, email_verified_at: now, last_sign_in_at: now }).select('id').single();
  if (cErr?.code === '23505' && retry) return upsertGoogleUser(p, false); // 2 request đăng nhập đồng thời
  if (cErr || !created) throw cErr ?? new Error('create user failed');

  await db().from('auth_accounts').insert({ provider: 'google', provider_account_id: p.sub, user_id: created.id });
  await db().from('profiles').upsert(
    { id: created.id, display_name: p.name?.trim() || email.split('@')[0], avatar_url: p.picture ?? null },
    { onConflict: 'id', ignoreDuplicates: true },
  );
  return { id: created.id };
}
