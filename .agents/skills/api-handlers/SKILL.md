# Skill: API Route Handler Patterns

---
name: api-handlers
description: Hướng dẫn viết API Route Handlers trong Next.js 16 App Router đúng chuẩn — bao gồm auth guard, validation, error handling, response format.
---

> Lưu ý: Next.js 16 dùng `RouteContext<'/api/path/[param]'>` làm ambient type cho context của Route Handler. Không cần import.

---

## 1. Cấu trúc một Route Handler chuẩn

```typescript
// app/api/dates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema validation cho request body
const createDateSchema = z.object({
  location_name: z.string().min(1),
  date_time: z.string().datetime().optional(),
  pros: z.string().optional(),
  cons: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

// GET — Lấy danh sách
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // 1. Kiểm tra auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Chưa đăng nhập' },
      { status: 401 }
    );
  }

  // 2. Query params
  const { searchParams } = request.nextUrl;
  const coupleId = searchParams.get('couple_id');

  // 3. Fetch data
  const { data, error } = await supabase
    .from('dates')
    .select('*')
    .eq('couple_id', coupleId ?? '')
    .order('date_time', { ascending: false });

  if (error) {
    console.error('[GET /api/dates]', error);
    return NextResponse.json(
      { error: 'Không thể tải dữ liệu' },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

// POST — Tạo mới
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. Auth guard
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  // 2. Parse & validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body không hợp lệ' }, { status: 400 });
  }

  const parsed = createDateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // 3. Insert
  const { data, error } = await supabase
    .from('dates')
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single();

  if (error) {
    console.error('[POST /api/dates]', error);
    return NextResponse.json({ error: 'Không thể tạo mới' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
```

---

## 2. Route Handler với Dynamic Segment

```typescript
// app/api/dates/[id]/route.ts

// GET chi tiết
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<'/api/dates/[id]'>
) {
  const { id } = await ctx.params; // ⚠️ params là Promise trong Next.js 16
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const { data, error } = await supabase
    .from('dates')
    .select('*')
    .eq('id', id)
    .single();

  if (error?.code === 'PGRST116') {
    return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
  }
  if (error) return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });

  return NextResponse.json({ data });
}

// PATCH cập nhật
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/dates/[id]'>
) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body không hợp lệ' }, { status: 400 });

  const { data, error } = await supabase
    .from('dates')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Không thể cập nhật' }, { status: 500 });
  return NextResponse.json({ data });
}

// DELETE
export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<'/api/dates/[id]'>
) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const { error } = await supabase.from('dates').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Không thể xóa' }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
```

---

## 3. API Route cho AI (Claude)

```typescript
// app/api/ai/chat/route.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Auth guard — bắt buộc
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const { messages, sessionId } = await request.json();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages,
    });

    const aiMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Lưu vào DB
    await supabase.from('ai_chat_messages').insert([
      { session_id: sessionId, sender: 'ai', content: aiMessage },
    ]);

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error('[POST /api/ai/chat]', error);
    return NextResponse.json(
      { error: 'AI không phản hồi được, vui lòng thử lại' },
      { status: 503 }
    );
  }
}
```

---

## 4. Response Format chuẩn

```typescript
// ✅ Success response
return NextResponse.json({ data: result });                    // GET, PATCH
return NextResponse.json({ data: result }, { status: 201 });   // POST (Created)
return new NextResponse(null, { status: 204 });                // DELETE (No Content)

// ✅ Error response — luôn có field "error" là string
return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
return NextResponse.json(
  { error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
  { status: 400 }
);
return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
```

---

## 5. HTTP Status Code tham khảo

| Code | Khi nào dùng |
|---|---|
| 200 | GET, PATCH thành công |
| 201 | POST tạo mới thành công |
| 204 | DELETE thành công (không có body) |
| 400 | Body/params không hợp lệ |
| 401 | Chưa đăng nhập |
| 403 | Đã đăng nhập nhưng không có quyền |
| 404 | Không tìm thấy resource |
| 409 | Conflict (ví dụ: email đã tồn tại) |
| 503 | Service ngoài không phản hồi (AI, Storage...) |
| 500 | Lỗi server không xác định |

---

## 6. Gọi API từ Client Component

```typescript
// lib/api/dates.ts — Wrapper functions để gọi API routes
export async function fetchDates(coupleId: string) {
  const res = await fetch(`/api/dates?couple_id=${coupleId}`);
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? 'Không thể tải dữ liệu');
  }
  const { data } = await res.json();
  return data;
}

export async function createDate(input: CreateDateInput) {
  const res = await fetch('/api/dates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? 'Không thể tạo mới');
  }
  const { data } = await res.json();
  return data;
}
```

> **Lưu ý**: Với Supabase, thường không cần API route trung gian — dùng trực tiếp Supabase Client hoặc Server Client. Chỉ tạo API route khi cần gọi AI, tích hợp dịch vụ bên ngoài, hoặc logic phức tạp trên server.
