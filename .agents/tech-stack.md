# Tech Stack — Dating Journal App

> Đọc file này để hiểu toàn bộ công nghệ được sử dụng trong dự án trước khi viết code.

---

## Framework & Runtime

| Công nghệ | Phiên bản | Ghi chú |
|---|---|---|
| **Next.js** | 16.3.5 | App Router, Turbopack, **KHÔNG dùng Pages Router** |
| **React** | 19.x | Server Components mặc định, dùng `'use client'` khi cần |
| **TypeScript** | 5.x | Strict mode bắt buộc |
| **Node.js** | 22.x (LTS) | Cài qua `nvm`, KHÔNG dùng v26 (lỗi macOS 12) |

---

## Styling

| Công nghệ | Phiên bản | Ghi chú |
|---|---|---|
| **Tailwind CSS** | v4 | Dùng `@import "tailwindcss"`, KHÔNG có `tailwind.config.js` |
| **CSS Variables** | — | Tất cả token màu/font/radius phải qua biến CSS |
| **PostCSS** | — | Config tại `postcss.config.mjs` dùng `@tailwindcss/postcss` |

> **Quy tắc bắt buộc**: KHÔNG bao giờ hardcode màu sắc hay font trực tiếp. Luôn dùng CSS token (`var(--color-primary)` hoặc Tailwind class `bg-primary`).

---

## Database & Backend

| Công nghệ | Vai trò | Ghi chú |
|---|---|---|
| **Supabase** | Postgres + Auth + Storage | Project ID: `roskerobqjeerxgxolui` |
| **Supabase Auth** | Xác thực người dùng | Email/password, OAuth Google (tương lai) |
| **Supabase Storage** | Lưu ảnh | Bucket `avatars` (public), `checkin-images` (private) |
| **Row Level Security** | Bảo mật dữ liệu | **Bắt buộc** cho mọi bảng mới |

---

## State Management & Data Fetching

| Công nghệ | Khi nào dùng |
|---|---|
| **Supabase Server Client** | Server Components, Route Handlers, Server Actions |
| **Supabase Browser Client** | Client Components cần realtime hoặc mutation |
| **TanStack Query v5** | Cache + refetch dữ liệu phức tạp ở Client Components |

---

## AI

| Công nghệ | Vai trò | Ghi chú |
|---|---|---|
| **Anthropic Claude API** | Thần số học, Tarot, Chatbot | **KHÔNG BAO GIỜ** gọi từ client |
| **API Routes** | `/api/ai/chat`, `/api/ai/reading` | Tất cả request AI phải qua đây |

---

## Form & Validation

| Công nghệ | Vai trò |
|---|---|
| **react-hook-form** | Quản lý form state |
| **zod** | Schema validation |
| **@hookform/resolvers** | Kết nối react-hook-form với zod |

---

## UI & Icons

| Công nghệ | Vai trò |
|---|---|
| **lucide-react** | Icon library duy nhất được dùng |
| **Custom components** | Tất cả trong `components/ui/` |
| **Storybook 10.6.0** | Quản lý và preview components |

---

## Testing & Documentation

| Công nghệ | Vai trò |
|---|---|
| **Storybook** | Component documentation + visual testing |
| **@storybook/addon-a11y** | Kiểm tra accessibility |
| **@storybook/addon-vitest** | Unit test trong Storybook |

---

## Build & Dev Tools

| Lệnh | Mục đích |
|---|---|
| `yarn dev` | Chạy dev server (Next.js, port 3000) |
| `yarn build` | Production build |
| `yarn storybook` | Chạy Storybook (port 6006) |
| `yarn build-storybook` | Build Storybook static |
| `nvm use 22` | Đảm bảo đúng Node version |

---

## Breaking Changes cần nhớ (Next.js 16)

1. **`middleware.ts` → `proxy.ts`** — File proxy đặt tại gốc project, export `proxy` function
2. **`params` và `searchParams` là Promise** — Phải `await` trước khi dùng
3. **`cookies()` là async** — Phải `await cookies()`
4. **`LayoutProps<'/'>`, `PageProps<'/'>`, `RouteContext<'/'>`** — Là ambient types, KHÔNG cần import
5. **Tailwind v4** — Dùng `@theme inline` thay vì `tailwind.config.js`
