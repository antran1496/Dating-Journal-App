# Skill: Cấu trúc Route & Navigation

---
name: routing
description: Quy tắc tổ chức route, đặt tên file, navigation, và bảo vệ route trong Next.js 16 App Router.
---

---

## 1. Cấu trúc thư mục `/app`

```
app/
├── (auth)/                   ← Route group auth (không ảnh hưởng URL)
│   ├── layout.tsx            ← Layout riêng: nền gradient, không có sidebar
│   ├── login/
│   │   └── page.tsx          → URL: /login
│   └── signup/
│       └── page.tsx          → URL: /signup
│
├── (app)/                    ← Route group chính (cần đăng nhập)
│   ├── layout.tsx            ← Layout chính: sidebar + header
│   ├── dashboard/
│   │   └── page.tsx          → URL: /dashboard
│   ├── dates/
│   │   ├── page.tsx          → URL: /dates (danh sách)
│   │   ├── new/
│   │   │   └── page.tsx      → URL: /dates/new (tạo mới)
│   │   └── [id]/
│   │       ├── page.tsx      → URL: /dates/[id] (chi tiết)
│   │       └── edit/
│   │           └── page.tsx  → URL: /dates/[id]/edit
│   ├── profile/
│   │   └── page.tsx          → URL: /profile
│   ├── insights/
│   │   └── page.tsx          → URL: /insights
│   ├── chat/
│   │   └── page.tsx          → URL: /chat
│   └── settings/
│       └── theme/
│           └── page.tsx      → URL: /settings/theme
│
├── api/                      ← API routes
│   └── ai/
│       ├── chat/
│       │   └── route.ts      → POST /api/ai/chat
│       └── reading/
│           └── route.ts      → POST /api/ai/reading
│
├── layout.tsx                ← Root layout (font, providers, metadata)
├── page.tsx                  ← Redirect → /dashboard
├── globals.css
└── not-found.tsx             ← 404 page
```

---

## 2. Đặt tên route segment

```
✅ Dùng            ❌ Tránh
/dashboard         /Dashboard
/dates             /date-list
/dates/new         /dates/create, /dates/add
/dates/[id]        /dates/[dateId] (chỉ dùng [dateId] nếu cần phân biệt)
/dates/[id]/edit   /dates/edit/[id]
/settings/theme    /settingsTheme
/api/ai/chat       /api/AI/Chat
```

---

## 3. Đặc biệt: file page.tsx & layout.tsx

```typescript
// ✅ Page với async params (Next.js 16: params là Promise)
export default async function DateDetailPage(
  props: PageProps<'/dates/[id]'>
) {
  const { id } = await props.params;
  // ...
}

// ✅ Layout với children
export default function AppLayout({ children }: LayoutProps<'/(app)'>) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

// ✅ Metadata cho SEO (trong page.tsx)
export const metadata = {
  title: 'Buổi hẹn hò | Dating Journal',
  description: 'Xem và chỉnh sửa chi tiết buổi hẹn hò của bạn',
};

// ✅ Dynamic metadata
export async function generateMetadata(
  props: PageProps<'/dates/[id]'>
): Promise<Metadata> {
  const { id } = await props.params;
  const date = await fetchDate(id);
  return {
    title: `${date?.location_name ?? 'Chi tiết'} | Dating Journal`,
  };
}
```

---

## 4. Bảo vệ route (Route Guard)

### Tầng 1: proxy.ts (Kiểm tra nhanh bằng cookie)

```typescript
// proxy.ts — Chỉ kiểm tra token cookie, không query DB
export async function proxy(request: NextRequest) {
  return await updateSession(request); // trong lib/supabase/middleware.ts
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
```

### Tầng 2: Server Component/Action (Kiểm tra chắc chắn từ DB)

```typescript
// app/(app)/dashboard/page.tsx
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Luôn kiểm tra lại ở đây, không tin tưởng hoàn toàn vào proxy
  if (!user) redirect('/login');
  // ...
}
```

---

## 5. Navigation

```typescript
// ✅ Server Component → dùng redirect()
import { redirect } from 'next/navigation';
redirect('/dashboard');

// ✅ Client Component → dùng useRouter()
'use client';
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/dates');
router.replace('/login'); // không lưu vào history
router.back();

// ✅ Link component cho anchor tag
import Link from 'next/link';
<Link href="/dates/new">Thêm buổi hẹn</Link>
<Link href={`/dates/${date.id}`}>Xem chi tiết</Link>

// ✅ Programmatic navigation sau mutation
const handleDelete = async (id: string) => {
  await deleteDate(id);
  router.push('/dates');
  router.refresh(); // refresh server data
};
```

---

## 6. Loading & Error UI cho route

```
app/(app)/dates/
├── page.tsx           ← Main content
├── loading.tsx        ← Skeleton UI khi đang load (tự động bởi Suspense)
├── error.tsx          ← Error boundary (phải là 'use client')
└── not-found.tsx      ← Khi gọi notFound() trong page
```

```typescript
// loading.tsx
export default function DatesLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <LoadingSkeleton key={i} variant="rect" height="120px" />
      ))}
    </div>
  );
}

// error.tsx
'use client';
export default function DatesError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <EmptyState
      icon={<AlertCircle />}
      title="Đã có lỗi xảy ra"
      description={error.message}
      action={reset}
      actionLabel="Thử lại"
    />
  );
}
```

---

## 7. API Route Naming

```
/api/dates              GET (list), POST (create)
/api/dates/[id]         GET (detail), PATCH (update), DELETE
/api/ai/chat            POST
/api/ai/reading         POST
/api/couples            GET, POST
/api/couples/join       POST (join với invite code)
/api/storage/upload     POST (upload ảnh)
```
