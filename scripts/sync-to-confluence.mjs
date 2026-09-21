import fs from 'node:fs';
import path from 'node:path';

// Load .env.local manually
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const env = loadEnv();
const DOMAIN = process.env.CONFLUENCE_DOMAIN || env.CONFLUENCE_DOMAIN;
const EMAIL = process.env.CONFLUENCE_EMAIL || env.CONFLUENCE_EMAIL || 'antran1496@gmail.com';
const API_TOKEN = process.env.CONFLUENCE_API_TOKEN || env.CONFLUENCE_API_TOKEN;
const SPACE_KEY = process.env.CONFLUENCE_SPACE_KEY || env.CONFLUENCE_SPACE_KEY;

if (!DOMAIN || !API_TOKEN) {
  console.error('❌ Lỗi: Thiếu CONFLUENCE_DOMAIN hoặc CONFLUENCE_API_TOKEN trong .env.local!');
  process.exit(1);
}

const cleanDomain = DOMAIN.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const baseUrl = `https://${cleanDomain}/wiki/api/v2`;
const authHeader = `Basic ${Buffer.from(`${EMAIL}:${API_TOKEN}`).toString('base64')}`;

const headers = {
  'Authorization': authHeader,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error [${res.status} ${res.statusText}] at ${url}: ${text}`);
  }
  return res.json();
}

async function getAllPagesInSpace(spaceId) {
  let allPages = [];
  let nextUrl = `/spaces/${spaceId}/pages?limit=100`;
  while (nextUrl) {
    const res = await apiRequest(nextUrl);
    allPages = allPages.concat(res.results || []);
    if (res._links && res._links.next) {
      nextUrl = res._links.next;
    } else {
      nextUrl = null;
    }
  }
  return allPages;
}

async function upsertPage({ spaceId, parentId, title, htmlContent, existingPages }) {
  const match = existingPages.find(p => p.title.trim().toLowerCase() === title.trim().toLowerCase());

  if (match) {
    console.log(`  🔄 Cập nhật: "${title}" (ID: ${match.id}, ver: ${match.version.number + 1})`);
    const payload = {
      id: match.id,
      status: 'current',
      title: title,
      body: {
        representation: 'storage',
        value: htmlContent
      },
      version: {
        number: match.version.number + 1,
        message: 'Tự động cập nhật nội dung phân cấp từ codebase'
      }
    };
    if (parentId) {
      payload.parentId = parentId;
    }
    const updated = await apiRequest(`/pages/${match.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    return updated;
  } else {
    console.log(`  ➕ Tạo mới trang con: "${title}"`);
    const payload = {
      spaceId: spaceId,
      status: 'current',
      title: title,
      body: {
        representation: 'storage',
        value: htmlContent
      }
    };
    if (parentId) {
      payload.parentId = parentId;
    }
    const created = await apiRequest('/pages', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return created;
  }
}

// -------------------------------------------------------------
// NỘI DUNG TỪNG TRANG CON (CHILD PAGES)
// -------------------------------------------------------------

function getContentParentHub() {
  return `
<ac:structured-macro ac:name="info">
  <ac:parameter ac:name="title">Trung tâm Tài liệu Kiến trúc Dự án</ac:parameter>
  <ac:rich-text-body>
    <p>Chào mừng đến với trang tài liệu kỹ thuật của <strong>Dating Journal App</strong>. Tài liệu đã được phân tách thành các trang chuyên mục riêng biệt ở <strong>cây danh mục menu bên trái (Page Tree)</strong> để bạn tiện tra cứu theo từng phần.</p>
  </ac:rich-text-body>
</ac:structured-macro>

<h2>📌 Danh sách các chuyên mục kiến trúc:</h2>
<ac:structured-macro ac:name="children">
  <ac:parameter ac:name="depth">2</ac:parameter>
</ac:structured-macro>

<hr/>

<h3>Tóm tắt Nhanh Công Nghệ Chính (Tech Stack):</h3>
<table>
  <thead>
    <tr>
      <th>Thành phần</th>
      <th>Công nghệ</th>
      <th>Mô tả</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Frontend</td><td>Next.js 16.3.5 (App Router), React 19, TypeScript</td><td>Server Components, SSR &amp; PWA</td></tr>
    <tr><td>Styling</td><td>Tailwind CSS v4 + Design Tokens</td><td>Đổi màu giao diện &amp; theme runtime</td></tr>
    <tr><td>Database &amp; Auth</td><td>Supabase PostgreSQL, Supabase Auth &amp; Storage</td><td>RLS bảo mật dữ liệu cặp đôi</td></tr>
    <tr><td>AI Intelligence</td><td>Google Gemini API (@google/genai)</td><td>Tư vấn hẹn hò, bói bài Tarot &amp; thần số học</td></tr>
    <tr><td>Testing &amp; UI</td><td>Storybook 10, Vitest, Playwright</td><td>Kiểm thử component độc lập &amp; a11y</td></tr>
  </tbody>
</table>
`;
}

function getContentOverview() {
  return `
<h2>1. Giới thiệu Dự án (Project Executive Summary)</h2>
<p><strong>Dating Journal App</strong> là nền tảng số hóa dành cho các cặp đôi, giải quyết bài toán lưu giữ kỷ niệm, hâm nóng tình cảm và cá nhân hóa trải nghiệm mối quan hệ.</p>

<ac:structured-macro ac:name="tip">
  <ac:parameter ac:name="title">Sứ mệnh Sản phẩm</ac:parameter>
  <ac:rich-text-body>
    <p>Tạo ra không gian riêng tư lãng mạn, an toàn tuyệt đối và tràn đầy cảm hứng để hai người cùng ghi lại hành trình tình yêu.</p>
  </ac:rich-text-body>
</ac:structured-macro>

<h2>2. Bốn Tính Năng Trọng Tâm</h2>
<table>
  <thead>
    <tr>
      <th>Tính năng</th>
      <th>Mô tả chi tiết</th>
      <th>Lợi ích mang lại</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Nhật ký Hẹn hò (Dating Journal)</strong></td>
      <td>Lưu trữ bài viết, ảnh chụp check-in (multi-image), địa điểm, cảm xúc, đánh giá sao và mong muốn cho lần sau.</td>
      <td>Lưu giữ trọn vẹn kỷ niệm từng buổi hẹn mà không bị trôi như mạng xã hội thông thường.</td>
    </tr>
    <tr>
      <td><strong>Đếm ngày yêu Real-time (Couple Counter)</strong></td>
      <td>Đồng hồ đếm từng ngày, giờ, phút từ ngày kỷ niệm. Nhắc nhở các mốc quan trọng (100 ngày, 1 năm,...).</td>
      <td>Giúp cặp đôi luôn nhớ và chuẩn bị cho các dịp đặc biệt.</td>
    </tr>
    <tr>
      <td><strong>Cá nhân hóa Giao diện (Custom Theming)</strong></td>
      <td>Cho phép đổi màu chủ đạo (Primary Color Palette) và Font chữ nghệ thuật ngay trong ứng dụng không cần reload.</td>
      <td>Tạo cảm giác thân thuộc, đúng với gu thẩm mỹ của từng cặp đôi.</td>
    </tr>
    <tr>
      <td><strong>Trợ lý Trí tuệ Nhân tạo (AI Dating Assistant)</strong></td>
      <td>Bói bài Tarot hàng ngày, tra cứu thần số học cặp đôi, giải mã tương hợp cung hoàng đạo và chatbot gợi ý địa điểm.</td>
      <td>Gợi ý chủ đề trò chuyện mới lạ và ý tưởng hẹn hò bất ngờ.</td>
    </tr>
  </tbody>
</table>
`;
}

function getContentArchitecture() {
  return `
<h2>1. Sơ đồ Khối Kiến trúc Hệ thống (System Architecture Diagram)</h2>
<p>Hệ thống được thiết kế theo kiến trúc phân tầng (Layered Architecture), tận dụng tối đa Server Components của Next.js 16 và mô hình Cloud Serverless:</p>

<ac:structured-macro ac:name="code">
  <ac:parameter ac:name="title">Sơ đồ Khối Phân Tầng Trực Quan</ac:parameter>
  <ac:parameter ac:name="language">text</ac:parameter>
  <ac:plain-text-body><![CDATA[+-----------------------------------------------------------------------------------+
|                           CLIENT & PRESENTATION LAYER                             |
|                                                                                   |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  |   Responsive Web   |  |   PWA / Mobile UI  |  |   Design System & Themes    |  |
|  |  (Next.js App UI)  |  |  (Manifest & Icons)|  | (CSS Variables / Storybook) |  |
|  +---------+----------+  +---------+----------+  +--------------+--------------+  |
+------------|-----------------------|----------------------------|-----------------+
             |                       |                            |
             v                       v                            v
+-----------------------------------------------------------------------------------+
|                        APPLICATION & SERVERLESS LAYER                             |
|                                                                                   |
|  +-------------------------------------+  +------------------------------------+  |
|  |     App Router (React 19 / SSR)     |  |     API Route Handlers (Next.js)   |  |
|  |  - (auth): /login, /signup          |  |  - /api/couples & /api/couples/join|  |
|  |  - (app): /dashboard, /dates, /chat |  |  - /api/dates & /api/dates/[id]    |  |
|  |  - (app): /insights, /settings      |  |  - /api/ai/chat & /api/ai/reading  |  |
|  +------------------+------------------+  +-----------------+------------------+  |
+---------------------|---------------------------------------|---------------------+
                      |                                       |
         +------------+------------------+                    |
         |                               |                    |
         v                               v                    v
+-----------------------+   +-------------------------------------------------------+
|  AI INTELLIGENCE TIER |   |             BACKEND PERSISTENCE & DATA TIER           |
| (Google Gemini GenAI) |   |                  (Supabase Cloud)                     |
|                       |   |                                                       |
| - Gemini 2.0 / Flash  |   | +------------------+  +-----------------------------+ |
| - Prompt Engine:      |   | |  Supabase Auth   |  |     PostgreSQL Database     | |
|   * Tarot Readings    |   | | (Email, OAuth,   |  | - Tables: profiles, couples | |
|   * Astrological/Palm |   | |  JWT Sessions)   |  |   dates, images, ai_chats...| |
|   * Relationship Chat |   | +--------+---------+  | - Row Level Security (RLS)  | |
|   * Date Suggestions  |   |          |            +--------------+--------------+ |
|                       |   |          |                           |                |
|                       |   |          v                           v                |
|                       |   | +------------------+  +-----------------------------+ |
|                       |   | | Supabase Storage |  |  Supabase Realtime Engine   | |
|                       |   | | (Check-in Photos,|  | (Live chat sync, couple     | |
|                       |   | |  User Avatars)   |  |  notifications)             | |
|                       |   | +------------------+  +-----------------------------+ |
+-----------------------+   +-------------------------------------------------------+]]></ac:plain-text-body>
</ac:structured-macro>

<h2>2. Sơ đồ Luồng Tương Tác Dữ liệu (Mermaid Interaction Flow)</h2>
<ac:structured-macro ac:name="code">
  <ac:parameter ac:name="title">Interaction Flowchart</ac:parameter>
  <ac:parameter ac:name="language">text</ac:parameter>
  <ac:plain-text-body><![CDATA[flowchart TD
    UserClient[Web Browser / PWA Mobile] -->|1. HTTPS Request| NextServer[Next.js 16 App Router]
    
    subgraph FrontendApp["Frontend Next.js"]
        NextServer --> ServerComp[Server Components]
        NextServer --> ClientComp[Client Components + React Query]
        NextServer --> ApiRoutes[Route Handlers /api/*]
    end

    subgraph SecurityGate["Security & Auth Gateway"]
        ServerComp --> SupaMiddleware[Supabase Auth Session Guard]
        ApiRoutes --> SupaMiddleware
    end

    subgraph CloudBackend["Supabase Cloud Platform"]
        SupaMiddleware --> Postgres[(PostgreSQL 16 + RLS)]
        ApiRoutes -->|Media Upload| Storage[Supabase Storage Buckets]
        ClientComp -.->|Subscribe| Realtime[Supabase Realtime Engine]
    end

    subgraph AIService["AI Cloud Engine"]
        ApiRoutes -->|Encrypted API Call| Gemini[Google Gemini 2.0 SDK]
        Gemini -->|Streaming / JSON Output| ApiRoutes
    end]]></ac:plain-text-body>
</ac:structured-macro>
`;
}

function getContentDatabase() {
  return `
<h2>1. Sơ đồ Thực thể Quan hệ (Database ERD)</h2>
<p>Toàn bộ cơ sở dữ liệu được tổ chức theo mối quan hệ xoay quanh thực thể Cặp đôi (<code>couples</code>) và bảo vệ bằng <strong>PostgreSQL Row Level Security (RLS)</strong>:</p>

<ac:structured-macro ac:name="code">
  <ac:parameter ac:name="title">Sơ đồ ERD Chi Tiết</ac:parameter>
  <ac:parameter ac:name="language">text</ac:parameter>
  <ac:plain-text-body><![CDATA[      +------------------------+
      |      auth.users        |
      |------------------------|
      | id: UUID (PK)          |
      | email: TEXT            |
      +-----------+------------+
                  | 1:1 (Trigger: on_auth_user_created)
                  v
      +------------------------+                     +---------------------------+
      |       profiles         | 1:1 (Cá nhân hóa)   |      user_preferences     |
      |------------------------+-------------------> |---------------------------|
      | id: UUID (PK, FK)      |                     | profile_id: UUID (PK, FK) |
      | display_name: TEXT     |                     | theme_mode: TEXT          |
      | avatar_url: TEXT       |                     | primary_color: TEXT       |
      | birth_date: DATE       |                     | font_heading: TEXT        |
      | created_at: TIMESTAMPTZ|                     | font_body: TEXT           |
      +-----------+------------+                     | locale: TEXT ('vi'|'en')  |
                  |                                  +---------------------------+
                  | 1:N (given_to, given_by)
                  |
         +--------+--------------------------+
         |                                   |
         v (created_by)                      v (member)
+------------------------+          +---------------------------+
|        couples         | 1:N      |       couple_members      |
|------------------------|<---------+---------------------------|
| id: UUID (PK)          |          | couple_id: UUID (PK, FK)  |
| invite_code: TEXT (UQ) |          | profile_id: UUID (PK, FK) |
| anniversary_date: DATE |          | nickname: TEXT            |
| relationship_status    |          | role: TEXT ('member'...)  |
| created_by: UUID (FK)  |          +---------------------------+
| created_at: TIMESTAMPTZ|
+---+---------------+----+
    |               |
    | 1:N           | 1:N
    v               v
+------------------------------------+    +------------------------------------+
|               dates                |    |          ai_chat_sessions          |
|------------------------------------|    |------------------------------------|
| id: UUID (PK)                      |    | id: UUID (PK)                      |
| couple_id: UUID (FK)               |    | couple_id: UUID (FK)               |
| date_time: TIMESTAMPTZ             |    | title: TEXT                        |
| end_date: TIMESTAMPTZ              |    | created_by: UUID (FK)              |
| location_name: TEXT                |    | created_at: TIMESTAMPTZ            |
| location_lat, location_lng: FLOAT  |    +-----------------+------------------+
| checkin_image_url: TEXT            |                      | 1:N
| checkin_image_urls: TEXT[]         |                      v
| pros, cons, wish_next_time: TEXT   |    +------------------------------------+
| rating: INT (1-5)                  |    |          ai_chat_messages          |
| created_by: UUID (FK)              |    |------------------------------------|
| created_at: TIMESTAMPTZ            |    | id: UUID (PK)                      |
| (Multi-images upload)              |    | session_id: UUID (FK)              |
+------------------------------------+    | sender: TEXT ('user' | 'ai')       |
                                          | content: TEXT                      |
                                          | created_at: TIMESTAMPTZ            |
                                          +------------------------------------+

+------------------------------------+    +------------------------------------+
|             nicknames              |    |             ai_readings            |
|------------------------------------|    |------------------------------------|
| id: UUID (PK)                      |    | id: UUID (PK)                      |
| couple_id: UUID (FK)               |    | profile_id: UUID (FK)              |
| given_by: UUID (FK -> profiles)    |    | type: 'numerology'|'zodiac'|'tarot'|
| given_to: UUID (FK -> profiles)    |    | input_data: JSONB                  |
| nickname: TEXT                     |    | result_text: TEXT                  |
| created_at: TIMESTAMPTZ            |    | created_at: TIMESTAMPTZ            |
+------------------------------------+    +------------------------------------+]]></ac:plain-text-body>
</ac:structured-macro>

<h2>2. Bảng Chi Tiết Schema &amp; Chính Sách RLS</h2>
<table>
  <thead>
    <tr>
      <th>Tên Bảng</th>
      <th>Khóa Chính &amp; Khóa Ngoại</th>
      <th>Mục đích</th>
      <th>Chính Sách RLS (Bảo mật)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>profiles</code></td>
      <td><strong>PK:</strong> <code>id</code><br/><strong>FK:</strong> <code>id -&gt; auth.users(id)</code></td>
      <td>Hồ sơ cá nhân (tên, avatar, ngày sinh)</td>
      <td>Chỉ user sở hữu được sửa. Đối phương trong cùng couple được phép đọc thông tin cơ bản.</td>
    </tr>
    <tr>
      <td><code>couples</code></td>
      <td><strong>PK:</strong> <code>id</code><br/><strong>FK:</strong> <code>created_by -&gt; profiles(id)</code></td>
      <td>Thông tin cặp đôi, ngày yêu, mã ghép đôi</td>
      <td>Chỉ người tạo hoặc thành viên có trong couple mới được SELECT và UPDATE.</td>
    </tr>
    <tr>
      <td><code>couple_members</code></td>
      <td><strong>PK:</strong> <code>(couple_id, profile_id)</code></td>
      <td>Quan hệ thành viên trong cặp đôi (tối đa 2 người)</td>
      <td>Được bảo vệ thông qua hàm <code>get_user_couple_ids()</code>.</td>
    </tr>
    <tr>
      <td><code>dates</code></td>
      <td><strong>PK:</strong> <code>id</code><br/><strong>FK:</strong> <code>couple_id -&gt; couples(id)</code></td>
      <td>Nhật ký các lần hẹn hò, ảnh kỷ niệm, đánh giá</td>
      <td>Chỉ 2 thành viên thuộc <code>couple_id</code> mới có quyền Xem, Thêm, Sửa, Xóa (CRUD).</td>
    </tr>
    <tr>
      <td><code>user_preferences</code></td>
      <td><strong>PK:</strong> <code>profile_id</code></td>
      <td>Tùy chọn theme (màu sắc, font, ngôn ngữ)</td>
      <td>Chỉ user sở hữu được phép đọc và sửa đổi.</td>
    </tr>
    <tr>
      <td><code>ai_chat_sessions</code> &amp; <code>messages</code></td>
      <td><strong>PK:</strong> <code>id</code><br/><strong>FK:</strong> <code>couple_id, session_id</code></td>
      <td>Lịch sử trò chuyện với AI tư vấn</td>
      <td>Chỉ thành viên trong cặp đôi mới được đọc/ghi tin nhắn.</td>
    </tr>
    <tr>
      <td><code>ai_readings</code></td>
      <td><strong>PK:</strong> <code>id</code><br/><strong>FK:</strong> <code>profile_id -&gt; profiles(id)</code></td>
      <td>Lưu kết quả bói bài Tarot, thần số học</td>
      <td>Chỉ user sở hữu mới có quyền truy cập.</td>
    </tr>
  </tbody>
</table>

<ac:structured-macro ac:name="info">
  <ac:parameter ac:name="title">Cơ chế chống đệ quy vô tận trong PostgreSQL RLS</ac:parameter>
  <ac:rich-text-body>
    <p>Hàm <code>get_user_couple_ids()</code> được đánh dấu <code>SECURITY DEFINER STABLE</code> để bỏ qua kiểm tra RLS bên trong hàm, ngăn chặn vòng lặp đệ quy giữa bảng <code>couples</code> và <code>couple_members</code>:</p>
    <pre><code>CREATE OR REPLACE FUNCTION get_user_couple_ids()
RETURNS SETOF uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT couple_id FROM couple_members WHERE profile_id = auth.uid();
$$;</code></pre>
  </ac:rich-text-body>
</ac:structured-macro>
`;
}

function getContentCodebase() {
  return `
<h2>1. Cây Thư mục Dự án Chi tiết</h2>
<p>Toàn bộ mã nguồn tuân thủ nghiêm ngặt mô hình <strong>Next.js 16 App Router</strong> và <strong>Atomic Component Architecture</strong>:</p>

<ac:structured-macro ac:name="code">
  <ac:parameter ac:name="title">Codebase Tree</ac:parameter>
  <ac:parameter ac:name="language">text</ac:parameter>
  <ac:plain-text-body><![CDATA[Dating Journal App/
├── app/                                 # App Router (Next.js 16)
│   ├── (app)/                           # Private Protected Pages
│   │   ├── dashboard/page.tsx           # Tổng quan: Đồng hồ đếm ngày yêu, kỷ niệm gần nhất
│   │   ├── dates/page.tsx               # Danh sách & chi tiết nhật ký hẹn hò
│   │   ├── chat/page.tsx                # Giao diện trò chuyện tương tác với AI
│   │   ├── insights/page.tsx            # Bói bài Tarot, thần số học, chiêm tinh
│   │   └── settings/page.tsx            # Tùy biến giao diện (Theme picker, Profile, Ngôn ngữ)
│   ├── (auth)/                          # Public Auth Pages
│   │   ├── login/page.tsx               # Form đăng nhập (Email/Password + Google OAuth)
│   │   └── signup/page.tsx              # Form đăng ký tài khoản mới
│   ├── api/                             # Serverless API Handlers
│   │   ├── ai/chat/route.ts             # AI Chatbot Handler (Google Gemini SDK)
│   │   ├── ai/reading/route.ts          # Tarot / Thần số học Handler
│   │   ├── couples/route.ts             # Khởi tạo cặp đôi, sinh Invite Code
│   │   ├── couples/join/route.ts        # Nhập mã ghép đôi
│   │   ├── dates/route.ts               # CRUD nhật ký hẹn hò & upload ảnh
│   │   ├── dates/[id]/route.ts          # Chi tiết/Sửa/Xóa buổi hẹn hò
│   │   └── profile/route.ts             # Quản lý hồ sơ cá nhân
│   ├── layout.tsx                       # Root Layout tích hợp Theme, Query, Locale Providers
│   └── globals.css                      # Định nghĩa CSS Variables Tokens & Tailwind v4
│
├── components/
│   ├── ui/                              # Design System Atoms (có Storybook stories)
│   │   ├── avatar.tsx                   # Avatar bo tròn, hỗ trợ fallback chữ cái
│   │   ├── badge.tsx                    # Huy hiệu trạng thái hẹn hò
│   │   ├── button.tsx                   # Nút tương tác đa kích thước & biến thể
│   │   ├── card.tsx                     # Khối thẻ nội dung chuẩn
│   │   ├── empty-state.tsx              # Trạng thái rỗng khi chưa có dữ liệu
│   │   ├── input.tsx & textarea.tsx     # Ô nhập văn bản kiểm soát lỗi qua Zod
│   │   ├── modal.tsx                    # Hộp thoại popup thân thiện mobile
│   │   └── toast.tsx                    # Thông báo tương tác nhanh
│   ├── features/                        # Component nghiệp vụ phức tạp
│   │   ├── couple-counter.tsx           # Đồng hồ đếm ngày yêu thời gian thực
│   │   ├── date-card.tsx                # Thẻ hiển thị buổi hẹn hò
│   │   ├── date-form.tsx                # Form tạo/sửa buổi hẹn hò
│   │   ├── multi-image-upload.tsx       # Tải lên nhiều ảnh kỷ niệm
│   │   ├── tarot-draw.tsx               # Hiệu ứng rút bài Tarot 3D sống động
│   │   ├── reading-card.tsx             # Thẻ hiển thị luận giải chiêm tinh
│   │   └── ai-chat.tsx                  # Khung chat với AI
│   ├── layouts/
│   │   └── app-sidebar.tsx              # Thanh điều hướng Navigation Bar
│   └── providers/
│       ├── theme-provider.tsx           # Context quản lý Theme
│       ├── theme-applier.tsx            # Bơm CSS variables vào Document Root
│       ├── locale-provider.tsx          # Đa ngôn ngữ (i18n vi/en)
│       └── query-provider.tsx           # TanStack Query Client
│
├── hooks/                               # Custom React Hooks
│   ├── use-couple.ts                    # Dữ liệu couple & ngày kỷ niệm
│   ├── use-dates.ts                     # Cache & fetch danh sách dates
│   ├── use-date-mutations.ts            # Optimistic mutations thêm/sửa/xóa hẹn hò
│   └── use-user-preferences.ts          # Quản lý cấu hình theme người dùng
│
├── lib/
│   ├── supabase/                        # Supabase Client, Server & Middleware
│   ├── ai/                              # Gemini SDK wrapper & prompt templates
│   ├── i18n/                            # Từ điển bản địa hóa (vi / en)
│   └── theme/                           # Bảng mã màu Palette & logic theme
│
├── supabase/migrations/                 # 5 bản SQL Migration tự động hóa
└── .agents/                             # Quy chuẩn kỹ thuật nghiêm ngặt cho AI Agent]]></ac:plain-text-body>
</ac:structured-macro>
`;
}

function getContentWorkflows() {
  return `
<h2>1. Luồng Xác thực &amp; Ghép đôi (Couple Pairing Flow)</h2>
<ol>
  <li><strong>Đăng ký / Đăng nhập:</strong> Người dùng tạo tài khoản qua Supabase Auth. Trigger PostgreSQL tự động khởi tạo bản ghi trong bảng <code>profiles</code>.</li>
  <li><strong>Tạo cặp đôi (Partner A):</strong> Partner A chọn "Bắt đầu tình yêu", nhập ngày kỷ niệm. Hệ thống tạo bản ghi <code>couples</code> và sinh <code>invite_code</code> ngẫu nhiên 6-8 ký tự. Partner A được thêm vào <code>couple_members</code>.</li>
  <li><strong>Tham gia (Partner B):</strong> Partner B đăng nhập, nhập <code>invite_code</code> vào form kết nối. Hệ thống xác thực mã, liên kết Partner B vào bảng <code>couple_members</code> của cùng <code>couple_id</code>. Cả 2 chính thức đồng bộ dữ liệu.</li>
</ol>

<h2>2. Luồng Nhật ký Hẹn hò &amp; Tải lên Nhiều ảnh (Dating Journal &amp; Multi-Image Flow)</h2>
<ol>
  <li>Người dùng điền form thông tin buổi hẹn hò (Tiêu đề, Địa điểm, Cảm xúc, Đánh giá sao, Chi phí).</li>
  <li>Chọn nhiều ảnh kỷ niệm: File ảnh được tải trực tiếp lên Supabase Storage bucket <code>dating-images</code> với đường dẫn phân lập theo <code>{couple_id}/{date_id}/{filename}</code>.</li>
  <li>Hệ thống lưu đường dẫn ảnh vào mảng <code>checkin_image_urls TEXT[]</code> trong bảng <code>dates</code>.</li>
  <li>React Query tự động cập nhật Cache (Optimistic UI update), hiển thị ngay lập tức trên dòng thời gian mà không cần chờ tải lại trang.</li>
</ol>

<h2>3. Luồng Luận giải AI &amp; Trò chuyện (AI Insight Engine)</h2>
<ol>
  <li><strong>Không gọi AI trực tiếp từ Client:</strong> Client chỉ gửi yêu cầu về API Route nội bộ (<code>/api/ai/reading</code> hoặc <code>/api/ai/chat</code>).</li>
  <li><strong>Server-side Auth Guard:</strong> API Route xác thực session người dùng qua Supabase JWT.</li>
  <li><strong>Prompt Injection &amp; Formatting:</strong> Hệ thống kết hợp thông tin ngày sinh/cung hoàng đạo từ <code>profiles</code> với Prompt Template chuyên môn (Tarot/Thần số học).</li>
  <li><strong>Gọi Google Gemini API:</strong> Sử dụng thư viện <code>@google/genai</code> trên server với API key bảo mật trong biến môi trường.</li>
  <li><strong>Lưu trữ kết quả:</strong> Lưu kết luận vào <code>ai_readings</code> hoặc <code>ai_chat_messages</code> để hai người có thể xem lại bất kỳ lúc nào.</li>
</ol>
`;
}

function getContentDesignSystem() {
  return `
<h2>1. Kiến trúc Theming Động (Zero-Rebuild Runtime Theming)</h2>
<p>Ứng dụng không hardcode bất kỳ mã màu cố định nào mà định nghĩa toàn bộ qua hệ thống <strong>CSS Variables Tokens</strong> trong <code>app/globals.css</code>:</p>

<table>
  <thead>
    <tr>
      <th>CSS Token Variable</th>
      <th>Giá trị Mặc định</th>
      <th>Mục đích Sử dụng</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>--color-primary</code></td>
      <td><code>#ff6b81</code> (Hồng san hô lãng mạn)</td>
      <td>Màu chủ đạo cho Buttons, Badges, Highlights, Active Tabs</td>
    </tr>
    <tr>
      <td><code>--color-bg</code></td>
      <td><code>#fff8f8</code> / <code>#121212</code> (Dark)</td>
      <td>Màu nền tổng thể của toàn bộ ứng dụng</td>
    </tr>
    <tr>
      <td><code>--color-surface</code></td>
      <td><code>#ffffff</code> / <code>#1e1e1e</code> (Dark)</td>
      <td>Màu nền của Cards, Dialogs, Sidebars</td>
    </tr>
    <tr>
      <td><code>--font-heading</code></td>
      <td><code>Playfair Display</code>, serif</td>
      <td>Phông chữ tiêu đề mang phong cách nghệ thuật, nhật ký</td>
    </tr>
    <tr>
      <td><code>--font-body</code></td>
      <td><code>Inter</code>, sans-serif</td>
      <td>Phông chữ nội dung rõ ràng, dễ đọc trên thiết bị di động</td>
    </tr>
  </tbody>
</table>

<h2>2. Cơ chế Đồng bộ Theme</h2>
<p>Khi người dùng chọn màu mới từ Palette hoặc Color Picker trong <code>/settings</code>:</p>
<ul>
  <li>Giá trị được lưu vào bảng <code>user_preferences</code> trong Supabase.</li>
  <li>Hook <code>useUserPreferences</code> tự động cập nhật state.</li>
  <li>Component <code>ThemeApplier</code> tiêm trực tiếp vào <code>document.documentElement.style.setProperty('--color-primary', newColor)</code>.</li>
  <li>Giao diện lập tức đổi màu mà không cần rebuild ứng dụng hay reload trang.</li>
</ul>

<h2>3. Tích hợp Storybook 10</h2>
<p>Tất cả các thành phần giao diện cơ bản trong <code>components/ui/</code> đều được trang bị file <code>*.stories.tsx</code> để:</p>
<ul>
  <li>Kiểm thử độc lập trạng thái Loading, Disabled, Variant, Error.</li>
  <li>Kiểm tra độ tương phản và tiêu chuẩn trợ năng Accessibility (a11y).</li>
  <li>Tạo tài liệu trực quan sống động cho toàn bộ design system.</li>
</ul>
`;
}

function getContentSecurity() {
  return `
<h2>1. Tiêu chuẩn Bảo mật Nghiêm ngặt (Security Standards)</h2>
<ul>
  <li><strong>Bảo mật RLS 100%:</strong> Tuyệt đối không để bất kỳ bảng cơ sở dữ liệu nào thiếu chính sách Row Level Security. Dữ liệu của cặp đôi nào thì chỉ duy nhất 2 người trong cặp đôi đó được quyền truy xuất.</li>
  <li><strong>Bảo vệ API Key:</strong> Toàn bộ khóa bí mật (<code>SUPABASE_SERVICE_ROLE_KEY</code>, <code>GEMINI_API_KEY</code>, <code>CONFLUENCE_API_TOKEN</code>) được quản lý trong <code>.env.local</code> và chỉ chạy trong môi trường Serverless API routes.</li>
  <li><strong>Storage Buckets:</strong> File ảnh kỷ niệm được lưu trữ trong bucket riêng biệt, phân lập thư mục theo <code>couple_id</code>.</li>
</ul>

<h2>2. Quy chuẩn Lập trình (Coding Standards)</h2>
<ul>
  <li><strong>TypeScript Strict Mode:</strong> Không sử dụng kiểu <code>any</code> trừ trường hợp bất khả kháng (phải có comment giải thích lý do).</li>
  <li><strong>Quy tắc đặt tên (Naming Conventions):</strong>
    <ul>
      <li>File &amp; Folder: <code>kebab-case</code> (ví dụ: <code>couple-counter.tsx</code>, <code>use-dates.ts</code>).</li>
      <li>Component &amp; Interface/Type: <code>PascalCase</code> (ví dụ: <code>CoupleCounter</code>, <code>DateRecord</code>).</li>
      <li>Biến &amp; Hàm: <code>camelCase</code>.</li>
      <li>Hằng số &amp; Env: <code>UPPER_SNAKE_CASE</code>.</li>
    </ul>
  </li>
  <li><strong>React 19 &amp; Server Components:</strong>
    <ul>
      <li>Mặc định luôn là Server Component để tối ưu hiệu năng SEO và SSR.</li>
      <li>Chỉ dùng <code>'use client'</code> khi cần tương tác DOM, React State hoặc Hooks.</li>
    </ul>
  </li>
</ul>
`;
}

function getContentRoadmap() {
  return `
<h2>Lộ trình Triển khai Dự án (Milestone Roadmap)</h2>
<table>
  <thead>
    <tr>
      <th>Phase</th>
      <th>Hạng mục Phát triển</th>
      <th>Trọng tâm Công việc</th>
      <th>Trạng thái</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Phase 1</strong></td>
      <td>Setup &amp; Design System</td>
      <td>Khởi tạo Next.js 16, Supabase, Tailwind v4 tokens, bộ UI components</td>
      <td><ac:structured-macro ac:name="status"><ac:parameter ac:name="colour">Green</ac:parameter><ac:parameter ac:name="title">ĐÃ HOÀN THÀNH</ac:parameter></ac:structured-macro></td>
    </tr>
    <tr>
      <td><strong>Phase 2</strong></td>
      <td>Auth &amp; Couple Onboarding</td>
      <td>Đăng ký/đăng nhập, ghép đôi bằng Invite Code, đặt biệt danh</td>
      <td><ac:structured-macro ac:name="status"><ac:parameter ac:name="colour">Green</ac:parameter><ac:parameter ac:name="title">ĐÃ HOÀN THÀNH</ac:parameter></ac:structured-macro></td>
    </tr>
    <tr>
      <td><strong>Phase 3</strong></td>
      <td>Dating Journal &amp; Media</td>
      <td>Nhật ký hẹn hò, tải nhiều ảnh, đếm ngày yêu thời gian thực</td>
      <td><ac:structured-macro ac:name="status"><ac:parameter ac:name="colour">Green</ac:parameter><ac:parameter ac:name="title">ĐÃ HOÀN THÀNH</ac:parameter></ac:structured-macro></td>
    </tr>
    <tr>
      <td><strong>Phase 4</strong></td>
      <td>AI Astrological &amp; Chatbot</td>
      <td>Bói bài Tarot, thần số học, chatbot tư vấn ý tưởng hẹn hò với Gemini 2.0</td>
      <td><ac:structured-macro ac:name="status"><ac:parameter ac:name="colour">Yellow</ac:parameter><ac:parameter ac:name="title">ĐANG HOÀN THIỆN</ac:parameter></ac:structured-macro></td>
    </tr>
    <tr>
      <td><strong>Phase 5</strong></td>
      <td>Storybook &amp; Visual Testing</td>
      <td>Kiểm thử giao diện với Storybook 10, Vitest Browser, Playwright</td>
      <td><ac:structured-macro ac:name="status"><ac:parameter ac:name="colour">Yellow</ac:parameter><ac:parameter ac:name="title">ĐANG PHÁT TRIỂN</ac:parameter></ac:structured-macro></td>
    </tr>
    <tr>
      <td><strong>Phase 6</strong></td>
      <td>Mobile PWA &amp; Notifications</td>
      <td>Đóng gói Progressive Web App, nhắc nhở ngày kỷ niệm qua Web Push</td>
      <td><ac:structured-macro ac:name="status"><ac:parameter ac:name="colour">Blue</ac:parameter><ac:parameter ac:name="title">KẾ HOẠCH</ac:parameter></ac:structured-macro></td>
    </tr>
  </tbody>
</table>
`;
}

// -------------------------------------------------------------
// MAIN CONTROLLER
// -------------------------------------------------------------

async function main() {
  console.log(`\n🚀 Đang kết nối tới Confluence Cloud: https://${cleanDomain}...`);
  console.log(`👤 Tài khoản: ${EMAIL}`);

  const spacesData = await apiRequest('/spaces');
  const spaces = spacesData.results || [];
  if (spaces.length === 0) throw new Error('Không tìm thấy Space!');

  let targetSpace = null;
  if (SPACE_KEY) {
    targetSpace = spaces.find(s => s.key.toLowerCase() === SPACE_KEY.toLowerCase());
  }
  if (!targetSpace) targetSpace = spaces[0];

  console.log(`🎯 Không gian: "${targetSpace.name}" (Key: ${targetSpace.key}, ID: ${targetSpace.id})`);

  // Lấy toàn bộ trang hiện có trong Space để tránh trùng lặp
  const existingPages = await getAllPagesInSpace(targetSpace.id);

  // 1. Tạo hoặc Cập nhật Trang Cha (Parent Hub)
  const parentTitle = 'Dating Journal App — Architecture & Project Structure';
  console.log(`\n📂 [Trang Cha] Kiểm tra trang tổng quan: "${parentTitle}"...`);
  const parentPage = await upsertPage({
    spaceId: targetSpace.id,
    parentId: null,
    title: parentTitle,
    htmlContent: getContentParentHub(),
    existingPages
  });

  console.log(`   🔗 Parent URL: https://${cleanDomain}/wiki/spaces/${targetSpace.key}/pages/${parentPage.id}`);

  // 2. Danh sách các trang con được phân cấp
  const subPages = [
    { title: '1. Tổng quan & Mục tiêu Dự án', fn: getContentOverview },
    { title: '2. Sơ đồ Kiến trúc Hệ thống', fn: getContentArchitecture },
    { title: '3. Sơ đồ Database ERD & Thiết kế CSDL', fn: getContentDatabase },
    { title: '4. Cấu trúc Mã nguồn & Phân rã Module', fn: getContentCodebase },
    { title: '5. Luồng Nghiệp vụ Trọng yếu', fn: getContentWorkflows },
    { title: '6. Design System & Theming Động', fn: getContentDesignSystem },
    { title: '7. Quy chuẩn Bảo mật & Lập trình', fn: getContentSecurity },
    { title: '8. Lộ trình Triển khai (Roadmap)', fn: getContentRoadmap }
  ];

  console.log(`\n📑 Đang đồng bộ 8 trang con vào menu phân cấp bên trái...`);

  for (const item of subPages) {
    const res = await upsertPage({
      spaceId: targetSpace.id,
      parentId: parentPage.id,
      title: item.title,
      htmlContent: item.fn(),
      existingPages
    });
    console.log(`   ↳ https://${cleanDomain}/wiki/spaces/${targetSpace.key}/pages/${res.id}`);
  }

  console.log(`\n✅ HOÀN TẤT ĐỒNG BỘ TOÀN BỘ CÂY THƯ MỤC TRÊN CONFLUENCE!`);
  console.log(`🌟 Xem toàn bộ tài liệu tại: https://${cleanDomain}/wiki/spaces/${targetSpace.key}/pages/${parentPage.id}`);
}

main().catch(err => {
  console.error('\n❌ Thất bại:', err.message);
  process.exit(1);
});
