# Dating Journal App — Implementation Plan

## 0. Tóm tắt quyết định lớn

| Câu hỏi | Quyết định | Lý do |
|---|---|---|
| Design trước hay code trước? | **Design tokens + component base trước**, chi tiết UI thì vừa design vừa code song song | Tránh hardcode màu/font, dễ theming sau; không mất thời gian vẽ mockup đầy đủ khi source nhỏ |
| Styling | Tailwind CSS + CSS variables cho token | Custom theme runtime dễ, không cần rebuild |
| Auth | Supabase Auth (email/password + OAuth Google) | Có sẵn, tích hợp RLS tốt |
| AI | Gọi Claude API (Anthropic) qua Next.js API route | Không lộ key ra client, dễ kiểm soát chi phí |
| Ảnh check-in / avatar | Supabase Storage | Cùng hệ sinh thái, RLS theo bucket |

---

## 1. Tech Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **State/data fetching**: React Query (TanStack Query) hoặc Supabase client trực tiếp trong Server Components
- **Backend/DB**: Supabase (Postgres + Auth + Storage + Row Level Security)
- **AI**: Anthropic API (Claude) — dùng cho: luận giải thần số học/cung hoàng đạo/tarot, chatbot tìm hiểu đối phương, gợi ý địa điểm hẹn hò
- **UI component base**: tự viết theo design system riêng (không dùng nguyên bộ shadcn mặc định để giữ được nét "app hẹn hò" riêng, nhưng có thể dùng shadcn làm khung rồi override token)
- **Icon**: lucide-react
- **Form**: react-hook-form + zod

---

## 2. Design System (làm trước, tối giản nhưng đủ dùng)

### 2.1 Token cần định nghĩa (CSS variables trong `globals.css`, đổi được runtime)

```css
:root {
  /* Màu nền/chữ theo theme sáng/tối */
  --color-bg: ...;
  --color-surface: ...;
  --color-text: ...;
  --color-text-muted: ...;

  /* Màu chủ đạo do user chọn */
  --color-primary: #ff6b81;      /* mặc định, user đổi được */
  --color-primary-fg: #ffffff;
  --color-accent: ...;

  /* Font do user chọn */
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Inter', sans-serif;

  /* Spacing / radius / shadow dùng chung */
  --radius-md: 12px;
  --shadow-card: ...;
}

[data-theme="dark"] { --color-bg: ...; --color-text: ...; }
```

### 2.2 Cơ chế custom giao diện của user

- Bảng `user_preferences` lưu: `primary_color`, `theme_mode` (light/dark/system), `font_heading`, `font_body`.
- Khi load app, đọc preferences → set các CSS variable ở `<html style={{...}}>` hoặc qua context Provider + `document.documentElement.style.setProperty`.
- Cho phép chọn từ palette dựng sẵn (5-8 màu) + custom color picker (nâng cao).
- Font: cho chọn từ danh sách Google Fonts giới hạn (3-5 font đôi heading/body) để tránh load quá nhiều font.

### 2.3 Component library tối thiểu cần build trước

Button, Input, Textarea, Card, Modal/Dialog, Avatar, Badge, Tabs, DatePicker, ImageUpload, Toast, EmptyState, LoadingSkeleton.

→ Tất cả dùng token ở trên, không hardcode màu trực tiếp trong component.

---

## 3. Database Schema (Supabase/Postgres)

```sql
-- users (Supabase Auth quản lý, không tự tạo bảng users nếu dùng auth.users)
--   id (uuid, = auth.users.id)

-- profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  birth_date DATE,          -- dùng cho thần số học / cung hoàng đạo
  created_at TIMESTAMPTZ DEFAULT now()
);

-- couples
CREATE TABLE couples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_code TEXT UNIQUE NOT NULL,
  anniversary_date DATE,
  relationship_status TEXT CHECK (relationship_status IN ('talking', 'dating', 'official', 'engaged', 'married')) DEFAULT 'talking',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- couple_members
CREATE TABLE couple_members (
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nickname TEXT,
  role TEXT DEFAULT 'member',
  PRIMARY KEY (couple_id, profile_id)
);

-- nicknames
CREATE TABLE nicknames (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  given_by UUID REFERENCES profiles(id),
  given_to UUID REFERENCES profiles(id),
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- dates (buổi hẹn hò)
CREATE TABLE dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  date_time TIMESTAMPTZ,
  location_name TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  checkin_image_url TEXT,
  pros TEXT,
  cons TEXT,
  wish_next_time TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ai_readings
CREATE TABLE ai_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  type TEXT CHECK (type IN ('numerology', 'zodiac', 'tarot')),
  input_data JSONB,
  result_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ai_chat_sessions
CREATE TABLE ai_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ai_chat_messages
CREATE TABLE ai_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  sender TEXT CHECK (sender IN ('user', 'ai')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- user_preferences
CREATE TABLE user_preferences (
  profile_id UUID REFERENCES profiles(id) PRIMARY KEY,
  theme_mode TEXT CHECK (theme_mode IN ('light', 'dark', 'system')) DEFAULT 'system',
  primary_color TEXT DEFAULT '#ff6b81',
  font_heading TEXT DEFAULT 'Playfair Display',
  font_body TEXT DEFAULT 'Inter'
);
```

### 3.1 Row Level Security (bắt buộc)

- `profiles`: user chỉ update được row của chính mình; đọc được profile của partner cùng couple.
- `couples` / `dates` / `nicknames` / `ai_*`: chỉ thành viên trong `couple_members` của `couple_id` đó mới đọc/ghi được.
- Viết policy dạng: `couple_id IN (SELECT couple_id FROM couple_members WHERE profile_id = auth.uid())`.

### 3.2 Storage buckets

- `avatars` (public read, owner write)
- `checkin-images` (chỉ đọc được bởi thành viên trong couple — dùng signed URL hoặc bucket private + policy)

---

## 4. Cấu trúc thư mục Next.js

```
/app
  /(auth)/login, /(auth)/signup
  /(app)/dashboard              -- trang chủ: đếm ngày yêu, tổng quan
  /(app)/dates                  -- danh sách + tạo buổi hẹn
  /(app)/dates/[id]
  /(app)/profile                -- biệt danh, avatar, ngày sinh
  /(app)/insights                -- thần số học / cung hoàng đạo / tarot
  /(app)/chat                    -- chat AI
  /(app)/settings/theme          -- custom giao diện
  /api/ai/chat
  /api/ai/reading
/components
  /ui        -- Button, Card, Modal... (design system)
  /features  -- CoupleCounter, DateCard, TarotDraw...
/lib
  /supabase  -- client.ts, server.ts, middleware.ts
  /ai        -- prompt templates, claude client wrapper
/styles/tokens.css
/types       -- shared TypeScript types
```

---

## 5. Roadmap theo Phase

**Phase 0 – Nền tảng (1-2 buổi)**
- Setup Next.js + Tailwind + Supabase project
- Định nghĩa token + build 8-10 component UI cơ bản
- Schema DB + RLS cơ bản (profiles, couples, couple_members)
- Auth: đăng ký/đăng nhập + tạo couple bằng invite code

**Phase 1 – Tính năng lõi**
- Đếm ngày yêu (dashboard hiển thị số ngày, mốc kỷ niệm)
- CRUD buổi hẹn hò: ghi chú ưu/nhược, mong muốn lần sau, upload ảnh checkin
- Đặt biệt danh + avatar cho đối phương

**Phase 2 – Custom giao diện**
- Trang Settings: đổi màu chủ đạo, sáng/tối, font
- Lưu preferences vào Supabase, áp dụng CSS variable runtime

**Phase 3 – AI**
- Luận giải thần số học/cung hoàng đạo dựa trên ngày sinh (prompt Claude, lưu kết quả)
- Rút bài tarot (UI chọn bài + AI diễn giải)
- Chatbot: hỏi về đối phương, gợi ý địa điểm hẹn hò tiếp theo (có thể dùng context từ lịch sử `dates` để gợi ý cá nhân hoá)

**Phase 4 – Polish**
- Chia sẻ tiến trình cho partner (real-time qua Supabase Realtime khi partner thêm ghi chú mới)
- Thông báo mốc kỷ niệm
- Responsive/mobile polish, empty states, loading states

---

## 6. Lưu ý AI integration

- Không gọi Claude API trực tiếp từ client — luôn qua `/api/ai/*` route để giấu key và kiểm soát rate limit/chi phí.
- Với thần số học/cung hoàng đạo/tarot: viết prompt template cố định, chèn dữ liệu (ngày sinh, lá bài) vào, cache kết quả trong `ai_readings` để tránh gọi lại API mỗi lần xem.
- Với chatbot gợi ý địa điểm: có thể truyền kèm context là lịch sử `dates` (địa điểm đã đi, rating, ghi chú "muốn gì lần sau") để gợi ý sát nhu cầu hơn thay vì gợi ý chung chung.
