import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import { generateCrockford, formatToken, normalizeToken, sha256 } from './invites';

describe('lib/invites', () => {
  it('generates Crockford base32 strings of correct length', () => {
    const token = generateCrockford(10);
    const code = generateCrockford(6);

    expect(token).toHaveLength(10);
    expect(code).toHaveLength(6);

    // Crockford characters only
    const validCrockford = /^[0-9A-Z]+$/;
    expect(validCrockford.test(token)).toBe(true);
    expect(validCrockford.test(code)).toBe(true);
  });

  it('formats 10-char token as xxxx-xxxx-xx', () => {
    const token = 'K3X9MA7QP2';
    const formatted = formatToken(token);
    expect(formatted).toBe('k3x9-ma7q-p2');
  });

  it('normalizes tokens removing spaces, dashes and casing', () => {
    expect(normalizeToken('k3x9-ma7q-p2')).toBe('K3X9MA7QP2');
    expect(normalizeToken('k 3 x 9 m a')).toBe('K3X9MA');
  });

  it('generates 64-char sha256 hex string', () => {
    const hash = sha256('TESTTOKEN');
    expect(hash).toHaveLength(64);
  });
});
