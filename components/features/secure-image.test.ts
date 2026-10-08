import { describe, it, expect } from 'vitest';
import { resolveMediaUrl } from './secure-image';

describe('resolveMediaUrl', () => {
  it('returns null for empty input', () => {
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl(undefined)).toBeNull();
    expect(resolveMediaUrl('')).toBeNull();
  });

  it('preserves full http/https URLs and data/blob URLs', () => {
    expect(resolveMediaUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg');
    expect(resolveMediaUrl('http://example.com/photo.jpg')).toBe('http://example.com/photo.jpg');
    expect(resolveMediaUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(resolveMediaUrl('blob:http://localhost/123')).toBe('blob:http://localhost/123');
  });

  it('converts media UUID into /api/media/[id] with thumb size by default', () => {
    const id = '12345678-1234-1234-1234-123456789abc';
    expect(resolveMediaUrl(id, 'thumb')).toBe(`/api/media/${id}?size=thumb`);
    expect(resolveMediaUrl(id, 'full')).toBe(`/api/media/${id}`);
  });

  it('handles existing /api/media URLs', () => {
    expect(resolveMediaUrl('/api/media/abc', 'thumb')).toBe('/api/media/abc?size=thumb');
    expect(resolveMediaUrl('/api/media/abc?size=thumb', 'thumb')).toBe('/api/media/abc?size=thumb');
    expect(resolveMediaUrl('/api/media/abc', 'full')).toBe('/api/media/abc');
  });
});
