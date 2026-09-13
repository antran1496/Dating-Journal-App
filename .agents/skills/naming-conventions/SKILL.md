# Skill: Quy tắc đặt tên (Naming Conventions)

---
name: naming-conventions
description: Quy tắc đặt tên file, biến, hằng số, type, interface, component, route trong Dating Journal App.
---

> Đọc kỹ và áp dụng nhất quán. Sai quy tắc đặt tên sẽ bị reject.

---

## 1. Tên File

| Loại | Quy tắc | Ví dụ đúng | Ví dụ sai |
|---|---|---|---|
| Component | `kebab-case.tsx` | `date-card.tsx` | `DateCard.tsx`, `datecard.tsx` |
| Story | `kebab-case.stories.tsx` | `date-card.stories.tsx` | `DateCard.stories.tsx` |
| Hook | `use-kebab-case.ts` | `use-couple-data.ts` | `useCoupleData.ts` |
| Utility | `kebab-case.ts` | `format-date.ts` | `formatDate.ts` |
| Type file | `kebab-case.ts` | `database.ts`, `index.ts` | `Database.ts` |
| Route page | `page.tsx` | `app/(app)/dashboard/page.tsx` | — |
| Route layout | `layout.tsx` | `app/(app)/layout.tsx` | — |
| API route | `route.ts` | `app/api/ai/chat/route.ts` | — |
| SQL migration | `NNN_description.sql` | `001_initial_schema.sql` | `schema.sql` |

---

## 2. Tên Biến & Hàm

| Loại | Quy tắc | Ví dụ đúng | Ví dụ sai |
|---|---|---|---|
| Biến thường | `camelCase` | `dateEntry`, `coupleId` | `date_entry`, `DateEntry` |
| Hàm | `camelCase` động từ | `fetchDates()`, `createCouple()` | `GetDates()`, `dates()` |
| Hàm async | `camelCase` + `async` | `async function loadProfile()` | — |
| Biến boolean | Bắt đầu bằng `is/has/can/should` | `isLoading`, `hasCouple`, `canEdit` | `loading`, `couple` |
| Event handler | Bắt đầu bằng `handle` | `handleSubmit`, `handleDelete` | `onSubmit`, `submit` |
| Callback prop | Bắt đầu bằng `on` | `onClose`, `onSuccess` | `close`, `handleClose` |

---

## 3. Tên Hằng Số & Enum

```typescript
// Hằng số: SCREAMING_SNAKE_CASE
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_AVATAR_URL = '/images/default-avatar.png';

// Enum: PascalCase tên, SCREAMING_SNAKE_CASE value
enum RelationshipStatus {
  TALKING = 'talking',
  DATING = 'dating',
  OFFICIAL = 'official',
  ENGAGED = 'engaged',
  MARRIED = 'married',
}

// Object constant thay thế enum (khuyến khích hơn với TS):
const RELATIONSHIP_STATUS = {
  TALKING: 'talking',
  DATING: 'dating',
  OFFICIAL: 'official',
} as const;
type RelationshipStatus = typeof RELATIONSHIP_STATUS[keyof typeof RELATIONSHIP_STATUS];
```

---

## 4. Tên Type & Interface

```typescript
// Type: PascalCase, mô tả rõ ràng
type DateEntry = { ... };
type UserPreferences = { ... };

// Interface: PascalCase, thêm "Props" cho component props
interface ButtonProps { ... }
interface DateCardProps { ... }
interface ModalProps { ... }

// KHÔNG thêm tiền tố "I" trước interface
// Sai: IButtonProps, IDateEntry
// Đúng: ButtonProps, DateEntry

// Generic type: dùng chữ hoa mô tả
type ApiResponse<TData> = {
  data: TData;
  error: string | null;
};
```

---

## 5. Tên Component

```typescript
// PascalCase, mô tả rõ chức năng
export function Button() { ... }          // ✅
export function DateCard() { ... }         // ✅
export function CoupleCounter() { ... }    // ✅
export function LoadingSkeleton() { ... }  // ✅

// KHÔNG đặt tên chung chung
export function Card() { ... }   // ⚠️ Chấp nhận vì là design system
export function Item() { ... }   // ❌ Quá chung
export function Comp() { ... }   // ❌ Viết tắt
```

---

## 6. Tên Route (URL Path)

```
/dashboard              ✅ kebab-case, số ít
/dates                  ✅ số nhiều cho danh sách
/dates/[id]             ✅ dynamic segment dùng số ít
/dates/new              ✅ action rõ ràng
/settings/theme         ✅ nested path

/Dates                  ❌ chữ hoa
/date-list              ❌ thêm "list" vào cuối
/getDate                ❌ động từ trong URL
/dates/[dateId]         ⚠️ chấp nhận nếu cần tránh nhầm lẫn
```

---

## 7. Tên Biến CSS (Tokens)

```css
/* Cấu trúc: --loại-tên-biến-thể */
--color-primary           /* Màu chính */
--color-primary-hover     /* Biến thể hover */
--color-primary-fg        /* Foreground (chữ trên nền primary) */
--color-text-muted        /* Màu chữ phụ */
--font-heading            /* Font tiêu đề */
--radius-md               /* Border radius */
--shadow-card             /* Box shadow */
--transition-normal       /* Duration + easing */
```

---

## 8. Tên Supabase Column

```sql
-- snake_case cho tất cả column
id              UUID
display_name    TEXT
avatar_url      TEXT
birth_date      DATE
created_at      TIMESTAMPTZ
couple_id       UUID  -- FK kết thúc bằng _id
profile_id      UUID
```

---

## 9. Tên Biến Môi Trường

```bash
# Public (an toàn để lộ client): NEXT_PUBLIC_
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Private (chỉ server-side): SCREAMING_SNAKE_CASE
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```
