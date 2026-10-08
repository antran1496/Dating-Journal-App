import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth/session';
import { mintSupabaseToken } from '@/lib/auth/supabase-token';
import type { AppUser } from '@/types/auth';

/** Client gắn quyền của user hiện tại (RLS). Truyền `user` nếu đã có để khỏi giải mã lại cookie. */
export async function createClient(user?: AppUser | null) {
  const u = user === undefined ? await getCurrentUser() : user;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, anon, {
    // Khi có accessToken, `supabase.auth.*` bị vô hiệu hoá (ném lỗi) → bắt được code còn sót
    accessToken: async () => (u ? (await mintSupabaseToken(u.id)).token : anon),
  });
}
