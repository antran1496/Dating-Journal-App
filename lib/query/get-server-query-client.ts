import { cache } from 'react';
import { makeQueryClient } from '@/lib/query/query-client';

/**
 * Một QueryClient cho mỗi request server (React `cache` theo request).
 * Chỉ dùng để dehydrate dữ liệu đã fetch sẵn xuống client — KHÔNG phải cache
 * dùng chung giữa các user.
 */
export const getServerQueryClient = cache(() => makeQueryClient());
