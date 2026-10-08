import 'server-only';
import crypto from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

const db = () => createAdminClient();

const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateCrockford(length: number): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CROCKFORD_ALPHABET[bytes[i] % CROCKFORD_ALPHABET.length];
  }
  return result;
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function normalizeToken(raw: string): string {
  return raw.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
}

export function formatToken(token: string): string {
  const clean = token.toLowerCase().replace(/[^0-9a-z]/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
  }
  return clean;
}

export interface CreatedInvite {
  id: string;
  token: string;
  formattedToken: string;
  code: string;
  expires_at: string;
  message: string | null;
}

/** Tạo invite mới cho couple, thu hồi các invite active cũ */
export async function createInvite(
  coupleId: string,
  createdBy: string,
  message?: string | null
): Promise<CreatedInvite> {
  const now = new Date().toISOString();

  // 1. Thu hồi các invite active cũ của couple này
  await db()
    .from('couple_invites')
    .update({ revoked_at: now })
    .eq('couple_id', coupleId)
    .is('used_at', null)
    .is('revoked_at', null)
    .gt('expires_at', now);

  // 2. Sinh token 10 ký tự và code 6 ký tự Crockford
  const token = generateCrockford(10);
  const code = generateCrockford(6);

  const tokenHash = sha256(token);
  const codeHash = sha256(code);
  const codeHint = code.slice(0, 2);

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const msg = message ? message.trim().slice(0, 140) : null;

  // 3. Ghi vào database
  const { data, error } = await db()
    .from('couple_invites')
    .insert({
      couple_id: coupleId,
      created_by: createdBy,
      token_hash: tokenHash,
      code_hash: codeHash,
      code_hint: codeHint,
      message: msg,
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[createInvite] Error:', error);
    throw new Error('Không thể tạo mã mời');
  }

  return {
    id: data.id,
    token,
    formattedToken: formatToken(token),
    code,
    expires_at: expiresAt,
    message: msg,
  };
}

/** Thu hồi invite */
export async function revokeInvite(inviteId: string, coupleId: string): Promise<boolean> {
  const { error } = await db()
    .from('couple_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', inviteId)
    .eq('couple_id', coupleId);

  return !error;
}

/** Lấy invite đang active của couple */
export async function getActiveInvite(coupleId: string) {
  const now = new Date().toISOString();
  const { data, error } = await db()
    .from('couple_invites')
    .select('id, expires_at, created_at, message, code_hint')
    .eq('couple_id', coupleId)
    .is('used_at', null)
    .is('revoked_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[getActiveInvite] Error:', error);
    return null;
  }
  return data;
}

export interface InvitePreview {
  valid: boolean;
  inviter_name?: string;
  inviter_avatar?: string | null;
  message?: string | null;
  expires_at?: string;
  error?: 'invalid' | 'expired' | 'used';
}

/** Xem trước lời mời từ token (không lộ ID couple) */
export async function previewInvite(rawToken: string): Promise<InvitePreview> {
  const token = normalizeToken(rawToken);
  if (!token) return { valid: false, error: 'invalid' };

  const tokenHash = sha256(token);
  const now = new Date().toISOString();

  const { data: invite, error } = await db()
    .from('couple_invites')
    .select('id, created_by, message, expires_at, used_at, revoked_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error || !invite) {
    return { valid: false, error: 'invalid' };
  }

  if (invite.used_at) {
    return { valid: false, error: 'used' };
  }

  if (invite.revoked_at || invite.expires_at <= now) {
    return { valid: false, error: 'expired' };
  }

  let inviterName = 'Người ấy';
  let inviterAvatar: string | null = null;

  if (invite.created_by) {
    const { data: profile } = await db()
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', invite.created_by)
      .maybeSingle();

    if (profile?.display_name) {
      inviterName = profile.display_name;
    }
    inviterAvatar = profile?.avatar_url ?? null;
  }

  return {
    valid: true,
    inviter_name: inviterName,
    inviter_avatar: inviterAvatar,
    message: invite.message,
    expires_at: invite.expires_at,
  };
}

/** Rate limit kiểm tra nạp mã mời */
async function checkRedeemRateLimit(userId: string, ip: string | null): Promise<boolean> {
  const now = Date.now();
  const userWindow = new Date(now - 15 * 60 * 1000).toISOString();
  const ipWindow = new Date(now - 60 * 60 * 1000).toISOString();

  const { count: userFails } = await db()
    .from('invite_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', userId)
    .eq('success', false)
    .gte('created_at', userWindow);

  if ((userFails ?? 0) >= 5) {
    return false;
  }

  if (ip) {
    const { count: ipFails } = await db()
      .from('invite_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .eq('success', false)
      .gte('created_at', ipWindow);

    if ((ipFails ?? 0) >= 30) {
      return false;
    }
  }

  return true;
}

export type RedeemResult =
  | { ok: true; couple_id: string }
  | { ok: false; error: string; message: string; statusCode?: number };

/** Xác nhận tham gia couple qua token hoặc code */
export async function redeemInvite(
  userId: string,
  input: { token?: string; code?: string },
  ip: string | null
): Promise<RedeemResult> {
  const allowed = await checkRedeemRateLimit(userId, ip);
  if (!allowed) {
    return {
      ok: false,
      error: 'rate_limited',
      message: 'Bạn đã nhập sai nhiều lần, thử lại sau ít phút nhé.',
      statusCode: 429,
    };
  }

  let tokenHash: string | null = null;
  let codeHash: string | null = null;

  if (input.token) {
    const cleanToken = normalizeToken(input.token);
    tokenHash = sha256(cleanToken);
  } else if (input.code) {
    const cleanCode = normalizeToken(input.code);
    codeHash = sha256(cleanCode);
  } else {
    return { ok: false, error: 'invalid_input', message: 'Vui lòng cung cấp link hoặc mã mời' };
  }

  const { data: coupleId, error } = await db().rpc('redeem_invite', {
    p_user: userId,
    p_token_hash: tokenHash,
    p_code_hash: codeHash,
  });

  if (error) {
    // Ghi nhận lần thử thất bại
    await db().from('invite_attempts').insert({
      profile_id: userId,
      ip,
      success: false,
    });

    const msg = error.message;
    if (msg.includes('already_in_couple')) {
      return { ok: false, error: 'already_in_couple', message: 'Bạn đã ở trong một cặp đôi khác rồi.' };
    }
    if (msg.includes('self_invite')) {
      return { ok: false, error: 'self_invite', message: 'Bạn không thể tự nhận lời mời của chính mình.' };
    }
    if (msg.includes('couple_full')) {
      return { ok: false, error: 'couple_full', message: 'Không gian này đã có đủ 2 người rồi.' };
    }
    if (msg.includes('invite_expired')) {
      return { ok: false, error: 'invite_expired', message: 'Lời mời đã hết hạn sau 48 giờ.' };
    }
    return { ok: false, error: 'invite_invalid', message: 'Mã mời không đúng hoặc đã được sử dụng.' };
  }

  // Ghi nhận thành công
  await db().from('invite_attempts').insert({
    profile_id: userId,
    ip,
    success: true,
  });

  return { ok: true, couple_id: coupleId as string };
}
