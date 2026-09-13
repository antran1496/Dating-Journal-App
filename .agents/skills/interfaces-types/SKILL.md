# Skill: Quy tắc Interface & Type

---
name: interfaces-types
description: Quy tắc định nghĩa TypeScript Interface, Type, Generic, và cách tổ chức type files trong Dating Journal App.
---

---

## 1. Khi nào dùng `type` vs `interface`

| Tình huống | Dùng | Lý do |
|---|---|---|
| Props của Component | `interface` | Dễ extend, IDE hint tốt hơn |
| Database entity | `type` | Thường map 1-1 từ DB schema |
| Union type | `type` | `interface` không hỗ trợ union |
| Generic utility | `type` | Linh hoạt hơn |
| Extend type khác | `interface` | Dùng `extends` |

```typescript
// ✅ Component props → interface
interface DateCardProps {
  date: DateEntry;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

// ✅ DB entity → type
type DateEntry = {
  id: string;
  couple_id: string;
  location_name: string | null;
  rating: number | null;
  created_at: string;
};

// ✅ Union → type
type ThemeMode = 'light' | 'dark' | 'system';
type RelationshipStatus = 'talking' | 'dating' | 'official' | 'engaged' | 'married';

// ✅ Utility generic → type
type ApiResponse<TData> = {
  data: TData | null;
  error: string | null;
};
```

---

## 2. Tổ chức file Type

```
/types
  index.ts          ← Re-export tất cả
  database.ts       ← Types từ Supabase schema
  api.ts            ← Request/Response types cho API routes
  forms.ts          ← Form input types (thường dùng với zod)
  ui.ts             ← Types riêng cho UI components (nếu cần)
```

### `types/database.ts` — Map từ Supabase

```typescript
// Đặt tên theo bảng, dạng PascalCase singular
export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  birth_date: string | null; // ISO date string "YYYY-MM-DD"
  created_at: string;        // ISO timestamp string
};

export type Couple = {
  id: string;
  invite_code: string;
  anniversary_date: string | null;
  relationship_status: RelationshipStatus;
  created_by: string;
  created_at: string;
};

export type RelationshipStatus = 'talking' | 'dating' | 'official' | 'engaged' | 'married';
```

### `types/api.ts` — API Response/Request

```typescript
export type ApiSuccess<T> = { data: T; error: null };
export type ApiError = { data: null; error: string };
export type ApiResult<T> = ApiSuccess<T> | ApiError;

// Request types
export type CreateDateRequest = {
  couple_id: string;
  location_name: string;
  date_time?: string;
  pros?: string;
  cons?: string;
  wish_next_time?: string;
  rating?: number;
};

export type UpdateDateRequest = Partial<Omit<CreateDateRequest, 'couple_id'>>;
```

### `types/forms.ts` — Zod inferred types

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const dateFormSchema = z.object({
  location_name: z.string().min(1, 'Vui lòng nhập địa điểm'),
  date_time: z.string().optional(),
  pros: z.string().optional(),
  cons: z.string().optional(),
  wish_next_time: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
});
export type DateFormValues = z.infer<typeof dateFormSchema>;
```

---

## 3. Utility Types hay dùng

```typescript
// Tạo type "Tạo mới" từ type đầy đủ (bỏ id, created_at, created_by)
type CreateInput<T> = Omit<T, 'id' | 'created_at' | 'created_by'>;
type CreateDateInput = CreateInput<DateEntry>;

// Tạo type "Cập nhật" — tất cả field optional trừ id
type UpdateInput<T> = Partial<Omit<T, 'id' | 'created_at'>> & { id: string };
type UpdateDateInput = UpdateInput<DateEntry>;

// WithCouple — thêm nested couple data
type DateEntryWithCouple = DateEntry & {
  couple: Pick<Couple, 'id' | 'anniversary_date'>;
};

// Nullable — dùng khi chưa load xong
type Nullable<T> = T | null;
type MaybeDate = Nullable<DateEntry>;
```

---

## 4. Quy tắc nghiêm ngặt

```typescript
// ❌ KHÔNG dùng any
function processData(data: any) { ... }

// ✅ Dùng unknown và narrow type
function processData(data: unknown) {
  if (typeof data === 'string') { ... }
  if (isDateEntry(data)) { ... }
}

// ❌ KHÔNG dùng non-null assertion (!) bừa bãi
const name = user!.display_name;

// ✅ Check an toàn
const name = user?.display_name ?? 'Người dùng';

// ❌ KHÔNG để return type là implicit any
async function getUser() {
  const { data } = await supabase.from('profiles').select().single();
  return data; // type là any
}

// ✅ Khai báo return type rõ ràng
async function getUser(): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select()
    .single();
  return data as Profile | null;
}
```

---

## 5. Type Guard

```typescript
// Dùng để narrow type từ unknown
function isProfile(value: unknown): value is Profile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'display_name' in value
  );
}

function isDateEntry(value: unknown): value is DateEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'couple_id' in value &&
    'created_by' in value
  );
}
```
