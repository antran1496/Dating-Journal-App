import { describe, it, expect, vi, beforeEach } from 'vitest';
import { consumeQuota, refundQuota } from './quota';
import * as adminModule from '@/lib/supabase/admin';

describe('lib/quota (Quota management)', () => {
  const mockRpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(adminModule, 'createAdminClient').mockReturnValue({
      rpc: mockRpc,
    } as any);
  });

  it('returns ok: true when consume_quota RPC succeeds', async () => {
    mockRpc.mockResolvedValueOnce({ data: true, error: null });

    const result = await consumeQuota('scope-123', 'cupid', 200, '2026-10-08');
    expect(result).toEqual({ ok: true });
    expect(mockRpc).toHaveBeenCalledWith('consume_quota', {
      p_scope: 'scope-123',
      p_feature: 'cupid',
      p_day: '2026-10-08',
      p_limit: 200,
    });
  });

  it('returns ok: false when consume_quota limit is exceeded', async () => {
    mockRpc.mockResolvedValueOnce({ data: false, error: null });

    const result = await consumeQuota('scope-123', 'cupid', 200, '2026-10-08');
    expect(result).toEqual({ ok: false });
  });

  it('returns ok: false when RPC throws an error', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'DB connection error' } });

    const result = await consumeQuota('scope-123', 'cupid', 200, '2026-10-08');
    expect(result).toEqual({ ok: false });
  });

  it('calls refund_quota RPC with correct parameters', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    await refundQuota('scope-123', 'cupid', '2026-10-08');
    expect(mockRpc).toHaveBeenCalledWith('refund_quota', {
      p_scope: 'scope-123',
      p_feature: 'cupid',
      p_day: '2026-10-08',
    });
  });
});
