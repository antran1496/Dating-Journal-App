import { describe, it, expect } from 'vitest';
import { toShareable, RawWrappedData } from './sanitize';

describe('lib/wrapped/sanitize (Whitelist verification)', () => {
  const sensitiveInput: RawWrappedData = {
    couple_id: 'couple-123',
    period: '2026-10',
    partner1_name: 'Minh Anh',
    partner2_name: 'Quốc Huy',
    total_dates: 12,
    unique_locations: 8,
    top_mood: 'love',
    total_photos: 45,
    longest_streak: 15,
    days_together: 414,
    milestones_count: 3,
    total_spend: 3200000,
    area_labels: ['Quận 1, TP.HCM', 'Tây Hồ, Hà Nội', '123 Đường Số 4, P.5'],
    // Sensitive fields that MUST NEVER leak
    note: 'Nhớ lần đầu hôn nhau ở góc công viên bí mật',
    pros: 'Rất lãng mạn, ôm chặt',
    cons: 'Hơi đông người, cãi nhau một chút',
    wish_next_time: 'Muốn đi đà lạt ở homestay riêng',
    comment: 'Bình luận riêng tư',
    song: 'Ánh Sao Và Bầu Trời',
    title: 'Hẹn hò bí mật',
    location_name: 'Khách sạn Hồng Phát 2',
    location_lat: 10.7769,
    location_lng: 106.7009,
    lat: 10.7769,
    lng: 106.7009,
  };

  it('scrubs all sensitive fields and only returns whitelist properties', () => {
    const output = toShareable(sensitiveInput);

    // Verify allowed fields exist
    expect(output.partner1_name).toBe('Minh Anh');
    expect(output.partner2_name).toBe('Quốc Huy');
    expect(output.total_dates).toBe(12);
    expect(output.days_together).toBe(414);
    expect(output.total_spend).toBeNull(); // Default not included unless enabled

    // Verify sensitive keys are NOT present
    const record = output as unknown as Record<string, unknown>;
    expect(record.note).toBeUndefined();
    expect(record.pros).toBeUndefined();
    expect(record.cons).toBeUndefined();
    expect(record.wish_next_time).toBeUndefined();
    expect(record.comment).toBeUndefined();
    expect(record.song).toBeUndefined();
    expect(record.title).toBeUndefined();
    expect(record.location_name).toBeUndefined();
    expect(record.location_lat).toBeUndefined();
    expect(record.location_lng).toBeUndefined();
    expect(record.lat).toBeUndefined();
    expect(record.lng).toBeUndefined();

    // Verify detailed street address is filtered out of area_labels
    expect(output.area_labels).toEqual(['Quận 1, TP.HCM', 'Tây Hồ, Hà Nội']);
  });

  it('includes total_spend only when explicitly requested in options', () => {
    const withSpend = toShareable(sensitiveInput, { includeSpend: true });
    expect(withSpend.total_spend).toBe(3200000);

    const withoutSpend = toShareable(sensitiveInput, { includeSpend: false });
    expect(withoutSpend.total_spend).toBeNull();
  });
});
