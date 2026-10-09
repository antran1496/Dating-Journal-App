/**
 * Nguồn duy nhất cho mọi TanStack Query key trong app.
 *
 * Lưu ý: key không chứa userId — an toàn nhờ `AuthCacheGuard` xoá toàn bộ cache
 * khi đăng xuất / đổi user. Đừng bỏ guard đó.
 */
export const keys = {
  profile: {
    me: () => ['profile', 'me'] as const,
  },
  preferences: {
    me: () => ['preferences', 'me'] as const,
  },
  couple: {
    current: () => ['couple', 'current'] as const,
  },
  dates: {
    all: () => ['dates'] as const,
    /** Prefix để invalidate mọi query dates của một couple. */
    scope: (coupleId: string) => ['dates', coupleId] as const,
    /** Infinite query, 20 mục/trang, có hỗ trợ search/filter. */
    list: (coupleId: string, filters?: { search?: string; mood?: string; tag?: string }) =>
      ['dates', coupleId, 'list', filters || {}] as const,
    /** Ngày này năm ngoái */
    onThisDay: (coupleId: string, day?: string) => ['dates', coupleId, 'on-this-day', day || ''] as const,
    /** Toàn bộ dates nhưng chỉ cột nhẹ cho lịch. */
    calendar: (coupleId: string) => ['dates', coupleId, 'calendar'] as const,
    /** Khoảng ngày cho lịch tình yêu */
    range: (coupleId: string, start: string, end: string) => ['dates', coupleId, 'range', start, end] as const,
    /** 3 mục mới nhất cho dashboard. */
    recent: (coupleId: string) => ['dates', coupleId, 'recent'] as const,
    detail: (id: string) => ['dates', 'detail', id] as const,
  },
  chat: {
    sessions: (coupleId: string) => ['chat', 'sessions', coupleId] as const,
    messages: (sessionId: string) => ['chat', 'messages', sessionId] as const,
  },
  readings: {
    mine: () => ['readings', 'mine'] as const,
  },
};

export const DATES_LIST_SEGMENT = 'list';
