import 'server-only';
import { SignJWT, importJWK, type JWK } from 'jose';

const TTL_SECONDS = 60 * 60; // khớp jwt_expiry hiện tại (3600)

let privateKey: { key: CryptoKey | Uint8Array; kid: string } | null = null;

async function getEs256Key() {
  if (privateKey) return privateKey;
  const jwk = JSON.parse(process.env.SUPABASE_JWT_PRIVATE_JWK!) as JWK;
  privateKey = { key: await importJWK(jwk, 'ES256'), kid: String(jwk.kid) };
  return privateKey;
}

/** Ký JWT mà PostgREST/Realtime/Storage của Supabase chấp nhận → auth.uid() = userId. */
export async function mintSupabaseToken(userId: string): Promise<{ token: string; expiresAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const jwt = new SignJWT({ role: 'authenticated', aud: 'authenticated' })
    .setSubject(userId)
    .setIssuer(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`)
    .setIssuedAt(now)
    .setExpirationTime(now + TTL_SECONDS);

  if (process.env.SUPABASE_JWT_PRIVATE_JWK) {
    const { key, kid } = await getEs256Key();
    return { token: await jwt.setProtectedHeader({ alg: 'ES256', typ: 'JWT', kid }).sign(key), expiresAt: now + TTL_SECONDS };
  }
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error('Thiếu SUPABASE_JWT_SECRET hoặc SUPABASE_JWT_PRIVATE_JWK');
  // Secret legacy dùng nguyên chuỗi (UTF-8), KHÔNG base64-decode
  return {
    token: await jwt.setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).sign(new TextEncoder().encode(secret)),
    expiresAt: now + TTL_SECONDS,
  };
}
