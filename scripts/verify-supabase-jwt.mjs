// node --env-file=.env.local scripts/verify-supabase-jwt.mjs <userIdCóThật>
import { SignJWT } from 'jose';

const [userId] = process.argv.slice(2);
if (!userId) {
  console.error('Usage: node --env-file=.env.local scripts/verify-supabase-jwt.mjs <userId>');
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
const secret = process.env.SUPABASE_JWT_SECRET;
if (!secret) {
  console.error('Thiếu SUPABASE_JWT_SECRET trong môi trường');
  process.exit(1);
}

const token = await new SignJWT({ role: 'authenticated', aud: 'authenticated' })
  .setSubject(userId)
  .setIssuedAt(now)
  .setExpirationTime(now + 300)
  .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
  .sign(new TextEncoder().encode(secret));

const call = (t, q) =>
  fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${q}`, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${t}`,
    },
  }).then(async (r) => ({ status: r.status, body: await r.json() }));

console.log('own profile   :', await call(token, `profiles?id=eq.${userId}&select=id,display_name`));
console.log('no token (anon):', await call(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, `profiles?select=id`));
