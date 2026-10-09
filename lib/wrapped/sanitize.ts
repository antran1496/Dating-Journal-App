export interface RawWrappedData {
  couple_id: string;
  period: string;
  partner1_name: string;
  partner2_name: string;
  total_dates: number;
  unique_locations: number;
  top_mood?: string | null;
  total_photos: number;
  longest_streak: number;
  days_together: number;
  milestones_count: number;
  total_spend?: number | null;
  area_labels: string[];
  // Potential sensitive fields that might be present in raw input
  note?: string;
  pros?: string;
  cons?: string;
  wish_next_time?: string;
  comment?: string;
  song?: string;
  title?: string;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  selected_photo_url?: string | null;
  [key: string]: unknown;
}

export interface ShareableWrappedData {
  partner1_name: string;
  partner2_name: string;
  period: string;
  total_dates: number;
  unique_locations: number;
  top_mood: string | null;
  total_photos: number;
  longest_streak: number;
  days_together: number;
  milestones_count: number;
  total_spend: number | null;
  area_labels: string[];
  selected_photo_url?: string | null;
}

const BANNED_KEYS = new Set([
  'note',
  'pros',
  'cons',
  'wish_next_time',
  'wish',
  'comment',
  'comments',
  'song',
  'title',
  'location_name',
  'location_lat',
  'location_lng',
  'lat',
  'lng',
  'coordinate',
  'coordinates',
]);

/**
 * Whitelist filter for Wrapped data before generating public / shareable cards.
 * Strictly guarantees private notes, exact addresses, and coordinates are scrubbed.
 */
export function toShareable(raw: RawWrappedData, options?: { includeSpend?: boolean; selectedPhotoUrl?: string }): ShareableWrappedData {
  // Ensure area_labels only contain generic city/district labels (no exact numbers / street addresses)
  const safeAreaLabels = (raw.area_labels || [])
    .filter((label): label is string => typeof label === 'string' && label.trim().length > 0)
    .map((label) => label.trim())
    // Exclude if label looks like a full street address or contains specific street keywords
    .filter((label) => !/^\d+|số \d+/i.test(label));

  const result: ShareableWrappedData = {
    partner1_name: String(raw.partner1_name || 'Bạn'),
    partner2_name: String(raw.partner2_name || 'Người ấy'),
    period: String(raw.period || ''),
    total_dates: Number(raw.total_dates) || 0,
    unique_locations: Number(raw.unique_locations) || 0,
    top_mood: raw.top_mood ? String(raw.top_mood) : null,
    total_photos: Number(raw.total_photos) || 0,
    longest_streak: Number(raw.longest_streak) || 0,
    days_together: Number(raw.days_together) || 0,
    milestones_count: Number(raw.milestones_count) || 0,
    total_spend: options?.includeSpend && raw.total_spend ? Number(raw.total_spend) : null,
    area_labels: Array.from(new Set(safeAreaLabels)).slice(0, 5),
    selected_photo_url: options?.selectedPhotoUrl || raw.selected_photo_url || null,
  };

  // Double check that no banned keys exist
  for (const key of Object.keys(result)) {
    if (BANNED_KEYS.has(key)) {
      delete (result as unknown as Record<string, unknown>)[key];
    }
  }

  return result;
}
