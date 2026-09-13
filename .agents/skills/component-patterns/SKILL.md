# Skill: Quy tắc viết Component

---
name: component-patterns
description: Quy tắc cấu trúc, phân loại, và viết React Component trong Dating Journal App — Server vs Client, props, composition, hooks.
---

---

## 1. Phân loại Component

### Server Component (Mặc định)
- Không có `'use client'`
- Có thể `async`, `await` trực tiếp
- Không dùng: `useState`, `useEffect`, `useRef`, event handlers, browser API
- Dùng cho: trang chính, layout, fetch dữ liệu, SEO

```typescript
// app/(app)/dates/page.tsx — Server Component
import { createClient } from '@/lib/supabase/server';

export default async function DatesPage() {
  const supabase = await createClient();
  const { data: dates } = await supabase.from('dates').select('*');
  return <DateList dates={dates ?? []} />;
}
```

### Client Component
- Có `'use client'` ở dòng đầu tiên
- Dùng hooks, event, browser API
- Dùng cho: form, button click, animation, realtime, state

```typescript
// components/features/date-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

export function DateForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  // ...
}
```

---

## 2. Cấu trúc file Component chuẩn

```typescript
// components/features/date-card.tsx

// 1. Imports (phân nhóm theo thứ tự)
import React from 'react';                          // React (nếu cần)
import { Heart, MapPin } from 'lucide-react';       // Icons
import Link from 'next/link';                       // Next.js
import { Card, CardBody, Badge, Avatar } from '@/components/ui'; // Internal UI
import { formatDate } from '@/lib/utils/format-date'; // Utilities
import type { DateEntry } from '@/types';            // Types (cuối cùng)

// 2. Types/Interface của component
interface DateCardProps {
  date: DateEntry;
  onDelete?: (id: string) => void;
  className?: string;
}

// 3. Component function
export function DateCard({ date, onDelete, className }: DateCardProps) {
  // 3a. Hooks
  const formattedDate = formatDate(date.date_time ?? date.created_at);

  // 3b. Handlers
  const handleDelete = () => onDelete?.(date.id);

  // 3c. Render
  return (
    <Card hoverable className={className}>
      <CardBody>
        {/* JSX */}
      </CardBody>
    </Card>
  );
}
```

---

## 3. Props Guidelines

```typescript
// ✅ Mọi prop nên có type rõ ràng
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  onClick?: () => void;
  children: React.ReactNode; // Bắt buộc
  className?: string;        // Luôn thêm để dễ override style
}

// ✅ Dùng optional prop với default value
function Button({ variant = 'primary', size = 'md', isLoading = false, ...props }: ButtonProps) { ... }

// ✅ Tách "data props" và "callback props"
interface DateCardProps {
  // Data
  date: DateEntry;
  authorProfile?: Profile;
  // Callbacks (bắt đầu bằng on)
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  // Style
  className?: string;
  compact?: boolean;
}

// ❌ Tránh truyền cả object lớn nếu chỉ cần 1-2 field
function Avatar({ user }: { user: User }) { // Tránh nếu chỉ cần name và src
// ✅ Tốt hơn
function Avatar({ name, src }: { name: string; src?: string }) {
```

---

## 4. Tổ chức thư mục Component

```
components/
├── ui/                        ← Design system primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── index.ts               ← Barrel export
│   └── ...
├── features/                  ← Feature-specific components
│   ├── date-card.tsx
│   ├── date-form.tsx
│   ├── couple-counter.tsx
│   ├── tarot-draw.tsx
│   └── ...
├── layouts/                   ← Layout components
│   ├── sidebar.tsx
│   ├── bottom-nav.tsx
│   └── ...
└── providers/                 ← Context providers
    ├── theme-provider.tsx
    └── query-provider.tsx
```

---

## 5. Composition Pattern

```typescript
// ✅ Dùng children để compose, tránh prop drilling
// Thay vì:
<DateCard date={date} showRating={true} showLocation={true} showActions={true} />

// Tốt hơn (nếu phức tạp):
<DateCard date={date}>
  <DateCard.Rating />
  <DateCard.Location />
  <DateCard.Actions onDelete={handleDelete} />
</DateCard>

// ✅ Hoặc tách thành nhiều component nhỏ hơn
<DateCardCompact date={date} />
<DateCardFull date={date} onDelete={handleDelete} />
```

---

## 6. Custom Hooks

```typescript
// hooks/use-couple.ts
// Quy tắc: tách business logic ra hook, component chỉ lo UI

'use client';

export function useCouple() {
  const supabase = createClient();

  const { data: couple, isLoading } = useQuery({
    queryKey: ['couple', 'current'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('couple_members')
        .select('couple:couples(*)')
        .eq('profile_id', user.id)
        .single();

      return data?.couple ?? null;
    },
  });

  const daysCount = couple?.anniversary_date
    ? differenceInDays(new Date(), new Date(couple.anniversary_date))
    : null;

  return { couple, daysCount, isLoading };
}

// Dùng trong component:
function CoupleCounter() {
  const { couple, daysCount, isLoading } = useCouple();
  if (isLoading) return <LoadingSkeleton />;
  if (!couple) return <EmptyState ... />;
  return <div>{daysCount} ngày</div>;
}
```

---

## 7. forwardRef cho UI Components

```typescript
// Luôn dùng forwardRef cho các UI primitive để hỗ trợ ref từ bên ngoài
import { forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cn(baseStyles, className)} {...props} />;
  }
);
Input.displayName = 'Input'; // Bắt buộc khi dùng forwardRef
```
