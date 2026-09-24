import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Admin client bypasses RLS — chỉ dùng trong Server-side Route Handlers
 * khi cần truy cập dữ liệu mà user hiện tại chưa có quyền RLS
 * (ví dụ: tìm couple bằng invite code khi chưa là thành viên)
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
