import { QueryCache, QueryClient } from '@tanstack/react-query';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface MakeQueryClientOptions {
  /** Gọi khi một query lỗi (chỉ dùng ở client, ví dụ phát hiện phiên hết hạn). */
  onQueryError?: (error: unknown) => void;
}

/**
 * Factory QueryClient dùng chung cho server (dehydrate) và client (cache chính).
 *
 * - `staleTime: Infinity`: dữ liệu không bao giờ tự cũ; chỉ refetch khi bị
 *   invalidate (mutation / Realtime) hoặc khi tải lại trang.
 * - `gcTime: 24h`: giữ cache khi không còn component nào dùng, để chuyển tab
 *   qua lại không phải tải lại.
 */
export function makeQueryClient(options: MakeQueryClientOptions = {}) {
  return new QueryClient({
    queryCache: options.onQueryError
      ? new QueryCache({ onError: options.onQueryError })
      : undefined,
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: ONE_DAY_MS,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  });
}
