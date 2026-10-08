import { createAdminClient } from '@/lib/supabase/admin';
import { todayVN } from '@/lib/time';

export interface QuotaResult {
  ok: boolean;
}

/**
 * Consumes 1 unit of quota atomically via PostgreSQL RPC.
 * Returns { ok: true } if within limit, or { ok: false } if quota exceeded.
 */
export async function consumeQuota(
  scope: string,
  feature: string,
  limit: number,
  day: string = todayVN(),
): Promise<QuotaResult> {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.rpc('consume_quota', {
      p_scope: scope,
      p_feature: feature,
      p_day: day,
      p_limit: limit,
    });

    if (error) {
      console.error('[consumeQuota] RPC error:', error);
      // Fallback safe: if RPC fails unexpectedly, allow or reject based on error
      return { ok: false };
    }

    return { ok: Boolean(data) };
  } catch (err) {
    console.error('[consumeQuota] Exception:', err);
    return { ok: false };
  }
}

/**
 * Refunds 1 unit of quota if a downstream operation (e.g. Gemini API) failed.
 */
export async function refundQuota(
  scope: string,
  feature: string,
  day: string = todayVN(),
): Promise<void> {
  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.rpc('refund_quota', {
      p_scope: scope,
      p_feature: feature,
      p_day: day,
    });

    if (error) {
      console.error('[refundQuota] RPC error:', error);
    }
  } catch (err) {
    console.error('[refundQuota] Exception:', err);
  }
}
