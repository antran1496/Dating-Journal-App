import { describe, it, expect } from 'vitest';
import { createDateSchema, dateFormSchema } from './forms';

describe('createDateSchema & dateFormSchema validation', () => {
  const validCoupleId = '12345678-1234-1234-1234-123456789abc';

  it('fails if neither media nor note nor location nor image is provided', () => {
    const result = createDateSchema.safeParse({
      couple_id: validCoupleId,
      date_time: '2026-11-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Cần ít nhất một ảnh/video hoặc một dòng ghi chú');
    }
  });

  it('succeeds with just note', () => {
    const result = createDateSchema.safeParse({
      couple_id: validCoupleId,
      note: 'Hôm nay đi xem phim vui lắm',
    });
    expect(result.success).toBe(true);
  });

  it('succeeds with just 1 media item', () => {
    const result = createDateSchema.safeParse({
      couple_id: validCoupleId,
      media: [
        {
          path: `${validCoupleId}/drafts/photo.webp`,
          kind: 'image',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects more than 1 video in media', () => {
    const result = createDateSchema.safeParse({
      couple_id: validCoupleId,
      media: [
        { path: `${validCoupleId}/drafts/v1.mp4`, kind: 'video' },
        { path: `${validCoupleId}/drafts/v2.mp4`, kind: 'video' },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts places up to 8', () => {
    const result = createDateSchema.safeParse({
      couple_id: validCoupleId,
      note: 'Dạo phố',
      places: [
        { name: 'Hồ Gươm', lat: 21.0285, lng: 105.8542 },
        { name: 'Nhà hát lớn', lat: 21.0245, lng: 105.8576 },
      ],
    });
    expect(result.success).toBe(true);
  });
});
