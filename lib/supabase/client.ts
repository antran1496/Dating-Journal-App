import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let cached: { token: string; expiresAt: number } | null = null;
let inflight: Promise<string | null> | null = null;
const REFRESH_BEFORE_SECONDS = 600;

async function getAccessToken(): Promise<string | null> {
  if (cached && cached.expiresAt - Date.now() / 1000 > REFRESH_BEFORE_SECONDS) return cached.token;
  inflight ??= fetch('/api/supabase-token', { credentials: 'same-origin', cache: 'no-store' })
    .then(async (res) => {
      if (res.status === 401) {
        cached = null;
        return null;
      } // hết phiên; supabase-js sẽ dùng anon key
      if (!res.ok) throw new Error('Không lấy được token');
      cached = (await res.json()) as { token: string; expiresAt: number };
      return cached.token;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function clearSupabaseTokenCache() {
  cached = null;
}

export function createClient(): SupabaseClient {
  client ??= createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { accessToken: getAccessToken },
  );
  return client;
}
