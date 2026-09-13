# Skill: Fetch Data & Data Fetching Patterns

---
name: fetch-data
description: Hướng dẫn cách fetch dữ liệu từ Supabase đúng cách trong Server Components, Client Components, và Server Actions.
---

---

## 1. Nguyên tắc cơ bản

| Loại component | Cách fetch | Client dùng được? |
|---|---|---|
| **Server Component** | Supabase Server Client trực tiếp | ❌ |
| **Client Component** | TanStack Query + Supabase Browser Client | ✅ |
| **Server Action** | Supabase Server Client | ❌ |
| **Route Handler** | Supabase Server Client | ❌ |

> **Quy tắc vàng**: Ưu tiên fetch ở Server Component. Chỉ dùng Client Component khi cần realtime, user interaction, hoặc cần state.

---

## 2. Fetch trong Server Component (Cách ưu tiên)

```typescript
// app/(app)/dates/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DatesPage() {
  const supabase = await createClient();

  // Kiểm tra auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch dữ liệu trực tiếp
  const { data: dates, error } = await supabase
    .from('dates')
    .select('*')
    .order('date_time', { ascending: false });

  if (error) {
    // Log error phía server, hiện UI thân thiện
    console.error('[DatesPage] fetch error:', error);
    return <div>Không thể tải dữ liệu, vui lòng thử lại.</div>;
  }

  return <DateList dates={dates ?? []} />;
}
```

---

## 3. Fetch trong Client Component với TanStack Query

```typescript
// hooks/use-dates.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { DateEntry } from '@/types';

// Query keys — tập trung tại 1 nơi để dễ invalidate
export const DATE_QUERY_KEYS = {
  all: ['dates'] as const,
  byCoupleId: (coupleId: string) => ['dates', coupleId] as const,
  byId: (id: string) => ['dates', 'detail', id] as const,
};

// Hook fetch danh sách
export function useDates(coupleId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: DATE_QUERY_KEYS.byCoupleId(coupleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dates')
        .select('*')
        .eq('couple_id', coupleId)
        .order('date_time', { ascending: false });

      if (error) throw new Error(error.message);
      return data as DateEntry[];
    },
    staleTime: 1000 * 60 * 5, // 5 phút
  });
}

// Hook fetch 1 item
export function useDateById(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: DATE_QUERY_KEYS.byId(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data as DateEntry;
    },
    enabled: !!id,
  });
}
```

---

## 4. Mutation (Thêm / Sửa / Xóa)

```typescript
// hooks/use-date-mutations.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { DATE_QUERY_KEYS } from './use-dates';
import type { DateEntry } from '@/types';

type CreateDateInput = Omit<DateEntry, 'id' | 'created_at' | 'created_by'>;

export function useCreateDate() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: CreateDateInput) => {
      const { data, error } = await supabase
        .from('dates')
        .insert(input)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as DateEntry;
    },
    onSuccess: (newDate) => {
      // Invalidate danh sách để refetch
      queryClient.invalidateQueries({
        queryKey: DATE_QUERY_KEYS.byCoupleId(newDate.couple_id),
      });
    },
  });
}

export function useDeleteDate() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, coupleId }: { id: string; coupleId: string }) => {
      const { error } = await supabase
        .from('dates')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return { id, coupleId };
    },
    onSuccess: ({ coupleId }) => {
      queryClient.invalidateQueries({
        queryKey: DATE_QUERY_KEYS.byCoupleId(coupleId),
      });
    },
  });
}
```

---

## 5. Server Action (Form Submission)

```typescript
// app/actions/date-actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createDateSchema = z.object({
  location_name: z.string().min(1, 'Vui lòng nhập địa điểm'),
  pros: z.string().optional(),
  cons: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
});

export async function createDateAction(formData: FormData) {
  const supabase = await createClient();

  // Kiểm tra auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Validate input
  const parsed = createDateSchema.safeParse({
    location_name: formData.get('location_name'),
    pros: formData.get('pros'),
    cons: formData.get('cons'),
    rating: formData.get('rating'),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // Insert
  const { error } = await supabase.from('dates').insert({
    ...parsed.data,
    created_by: user.id,
  });

  if (error) {
    return { error: { _form: ['Không thể lưu, vui lòng thử lại'] } };
  }

  // Revalidate cache
  revalidatePath('/dates');
  redirect('/dates');
}
```

---

## 6. Xử lý Loading & Error State

```typescript
// ✅ Pattern chuẩn trong Client Component
function DateList({ coupleId }: { coupleId: string }) {
  const { data: dates, isLoading, error } = useDates(coupleId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="rect" height="120px" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle />}
        title="Không thể tải dữ liệu"
        description="Vui lòng kiểm tra kết nối internet và thử lại."
        action={() => window.location.reload()}
        actionLabel="Thử lại"
      />
    );
  }

  if (!dates?.length) {
    return (
      <EmptyState
        icon={<Calendar />}
        title="Chưa có buổi hẹn nào"
        description="Hãy thêm buổi hẹn đầu tiên của bạn!"
        action={() => router.push('/dates/new')}
        actionLabel="+ Thêm buổi hẹn"
      />
    );
  }

  return (
    <div className="space-y-4">
      {dates.map((date) => <DateCard key={date.id} date={date} />)}
    </div>
  );
}
```

---

## 7. Realtime Subscription

```typescript
// hooks/use-realtime-dates.ts
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { DATE_QUERY_KEYS } from './use-dates';

export function useRealtimeDates(coupleId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`dates:${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dates',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          // Khi có thay đổi, invalidate query để refetch
          queryClient.invalidateQueries({
            queryKey: DATE_QUERY_KEYS.byCoupleId(coupleId),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, queryClient, supabase]);
}
```
