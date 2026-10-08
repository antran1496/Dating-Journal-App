import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';

vi.mock('server-only', () => ({}));

// Mock Supabase admin client
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'auth_login_tokens') {
        return {
          insert: mockInsert,
          select: () => ({
            eq: () => ({
              is: () => ({
                gt: () => ({
                  maybeSingle: mockMaybeSingle,
                }),
              }),
            }),
          }),
          update: () => ({
            eq: mockUpdate,
          }),
        };
      }
      if (table === 'auth_login_attempts') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                gte: () => ({ count: 0 }),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'auth_users') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'user-123', email_verified_at: '2026-01-01T00:00:00Z' },
              }),
            }),
          }),
          update: () => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          insert: () => ({
            select: () => ({
              single: vi.fn().mockResolvedValue({ data: { id: 'new-user' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    },
  }),
}));

vi.mock('@/lib/email/send', () => ({
  sendMagicLinkEmail: vi.fn().mockResolvedValue({ ok: true }),
}));

describe('lib/auth/magic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates SHA-256 hash correctly for tokens', () => {
    const raw = 'test-token-123';
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    expect(hash).toHaveLength(64);
  });

  it('returns null when consumeMagicToken receives empty token', async () => {
    const { consumeMagicToken } = await import('./magic');
    const result = await consumeMagicToken('');
    expect(result).toBeNull();
  });

  it('returns null when token is not found or already used', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const { consumeMagicToken } = await import('./magic');
    const result = await consumeMagicToken('non-existent-token');
    expect(result).toBeNull();
  });

  it('consumes token and returns user when valid token is provided', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 'token-row-1', email: 'test@example.com' },
      error: null,
    });
    mockUpdate.mockResolvedValueOnce({ error: null });

    const { consumeMagicToken } = await import('./magic');
    const result = await consumeMagicToken('valid-token-123');
    expect(result).toEqual({ id: 'user-123', email: 'test@example.com' });
  });
});
