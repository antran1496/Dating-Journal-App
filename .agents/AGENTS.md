# Dating Journal App — Agent Rules

> [!IMPORTANT]
> **Mọi agent PHẢI đọc file này trước khi bắt đầu bất kỳ công việc nào.**

## 1. Quy tắc chung

- **Ngôn ngữ code**: TypeScript (strict mode). Không dùng `any` trừ khi bắt buộc và phải comment lý do.
- **Styling**: Tailwind CSS + CSS variables (tokens). **KHÔNG hardcode màu/font trực tiếp** — luôn dùng token từ design system.
- **Component**: Tất cả component UI phải dùng CSS variables (`var(--color-primary)`, `var(--font-body)`, ...).
- **File naming**: kebab-case cho files, PascalCase cho components và types.
- **Import paths**: Dùng alias `@/` thay vì relative path dài.

## 2. Kiến trúc

- **Framework**: Next.js App Router
- **Database**: Supabase (Postgres + Auth + Storage + RLS)
- **AI**: Anthropic Claude API qua `/api/ai/*` route — KHÔNG BAO GIỜ gọi trực tiếp từ client
- **State**: React Query (TanStack Query) cho client components, Supabase client cho Server Components

## 3. Cấu trúc thư mục

```
/app              — Routes (App Router)
/components/ui    — Design system components (Button, Card, Modal, ...)
/components/features — Feature components (CoupleCounter, DateCard, ...)
/lib/supabase     — Supabase client, server, middleware
/lib/ai           — AI prompt templates, Claude wrapper
/styles           — tokens.css, globals
/types            — Shared TypeScript types
```

## 4. Database & Security

- Luôn viết RLS policy cho mọi bảng mới.
- Pattern RLS: `couple_id IN (SELECT couple_id FROM couple_members WHERE profile_id = auth.uid())`
- Storage: dùng signed URL cho ảnh private, public bucket cho avatars.

## 5. Design System Tokens

Tất cả màu sắc, font, spacing, radius, shadow phải được định nghĩa trong CSS variables:
- `--color-primary`, `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`
- `--font-heading`, `--font-body`
- `--radius-md`, `--shadow-card`

User có thể thay đổi theme runtime → tokens PHẢI hoạt động với cả light/dark mode.

## 6. Git & Branching Rules

- **NGHIÊM CẤM TỰ Ý ĐẨY/MERGE VÀO NHÁNH `main`**:
  - Tuyệt đối **KHÔNG** tự ý merge hoặc push code vào nhánh `main` cho đến khi có yêu cầu rõ ràng từ người dùng.
  - **Mọi tính năng mới (feature), sửa lỗi (bug/fix), cải tiến UI hay refactor** đều BẮT BUỘC phải tạo và làm việc trên một nhánh riêng biệt (VD: `feat/...`, `fix/...`, `chore/...`).
  - Sau khi hoàn thành trên nhánh riêng: chỉ commit (hoặc push nhánh đó lên remote nếu được yêu cầu), báo cáo cho user và **CHỜ LỆNH/YÊU CẦU** trước khi merge hoặc push vào `main`.
- **Quy tắc tạo nhánh**:
  - **LUÔN LUÔN tạo branch mới từ `main`**. Không bao giờ checkout branch mới từ feature branch khác chưa được merge. Quy trình: checkout `main` → pull latest → tạo branch mới từ `main`.
- **Commit**:
  - Commit messages bằng tiếng Anh, conventional commits format (`feat:`, `fix:`, `refactor:`, `chore:`, ...).
  - Không commit secrets, `.env.local`, node_modules.
  - Tuân thủ quy tắc trong skill `auto-commit`: không tự ý commit/push nếu người dùng chưa yêu cầu rõ ràng.

## 7. Tham khảo kế hoạch

Đọc file `.agents/plan/PLAN.md` để hiểu roadmap và schema database đầy đủ.

---

## 8. Skills & Tài liệu tham khảo

> Đọc skill tương ứng TRƯỚC khi viết code liên quan đến topic đó.

| File | Nội dung |
|---|---|
| [tech-stack.md](.agents/tech-stack.md) | Toàn bộ tech stack, phiên bản, breaking changes Next.js 16 |
| [skills/naming-conventions/SKILL.md](.agents/skills/naming-conventions/SKILL.md) | Quy tắc đặt tên file, biến, hàm, type, route, CSS token, env var |
| [skills/text-strings/SKILL.md](.agents/skills/text-strings/SKILL.md) | Quy tắc xử lý text, string, validation message, format ngày/số |
| [skills/interfaces-types/SKILL.md](.agents/skills/interfaces-types/SKILL.md) | Khi nào dùng interface vs type, tổ chức file type, utility types |
| [skills/component-patterns/SKILL.md](.agents/skills/component-patterns/SKILL.md) | Server vs Client component, cấu trúc file, props, hooks, forwardRef |
| [skills/routing/SKILL.md](.agents/skills/routing/SKILL.md) | Cấu trúc thư mục /app, route naming, navigation, route guard, loading/error |
| [skills/fetch-data/SKILL.md](.agents/skills/fetch-data/SKILL.md) | Fetch trong Server Component, TanStack Query, mutation, Server Action, realtime |
| [skills/api-handlers/SKILL.md](.agents/skills/api-handlers/SKILL.md) | Viết API Route Handler: auth guard, validation, response format, status code |
| [skills/design-system/SKILL.md](.agents/skills/design-system/SKILL.md) | Design tokens, màu sắc, typography, spacing |
| [skills/supabase-integration/SKILL.md](.agents/skills/supabase-integration/SKILL.md) | Supabase client setup, RLS patterns, Storage |
| [skills/supabase-migrations/SKILL.md](.agents/skills/supabase-migrations/SKILL.md) | Hướng dẫn tạo và chạy Supabase Migrations thay vì thao tác tay trên web |
| [skills/auto-commit/SKILL.md](.agents/skills/auto-commit/SKILL.md) | Hướng dẫn tự động thực hiện git add, commit, push code lên Github theo yêu cầu |
| [plan/PLAN.md](.agents/plan/PLAN.md) | Roadmap đầy đủ, schema DB, kế hoạch từng Phase |
