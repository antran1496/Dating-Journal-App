<USER_REQUEST>
đọc file /public/dating-journal-v2.html và plan sau rồi bắt đầu thực hiện thiết lập v2 của ứng dụng, 

yêu cầu làm việc như 1 chuyên gia

# Dating Journal v1 → v2 — Execution Plan (cho AI agent)

> **Cách dùng:** Đọc hết mục 0–4 trước. Sau đó thực hiện lần lượt từng Phase ở mục 5. Mỗi task có ID, file cần tạo/sửa, chi tiết và **Acceptance (AC)** để tự kiểm. Không hỏi lại các điểm đã có "Quyết định mặc định" ở mục 3 — cứ làm theo mặc định. Chỉ dừng hỏi khi gặp mục đánh dấu 🛑.
>
> **Nguồn sự thật về UI/copy:** `Dating_Journal_v2.md` (spec màn hình). Chuỗi tiếng Việt phải copy **nguyên văn** từ file đó vào `lib/i18n/translations.ts`. Số liệu trong spec là *dữ liệu mẫu*, không hard-code.
> **Nguồn sự thật về code hiện tại:** repo trong `Archive.zip` (phân tích ở mục 1).

---

## 00. PHẠM VI BẢN NÀY (ưu tiên cao nhất, ghi đè mọi chỗ khác trong tài liệu)

1. **Không có gói Plus / không có trả phí.** Mọi tính năng trong spec đều **miễn phí cho tất cả**. Spec có nhiều chỗ nhắc Plus — xử lý như sau:
   - **Bỏ hoàn toàn khỏi UI:** badge `👑 Plus`, banner "Gói Plus chung cho cả hai", card "Muốn không giới hạn?", mục "Gói của bạn" trong Cài đặt, màn "Gói Plus chung cho cả hai" (bảng giá, thanh toán MoMo/ZaloPay/VNPay, "Tặng người yêu"), mục "Bộ theme và sticker độc quyền", dòng "Từ 39.000đ…" và section "Một người trả phí…" trên landing, dòng "Bản Plus…" ở Wrapped/Thẻ chia sẻ, "Dành cho Plus", "Bản Plus có thể tắt".
   - **Không dựng:** route `/plus`, billing, gift code, payment adapter, bảng `couple_entitlements`, `payment_orders`, `gift_codes`, env thanh toán (đã gỡ khỏi mục 4). **Phase 8 bị loại khỏi phạm vi.**
   - **Mở khoá toàn bộ:** Bản đồ kỷ niệm, Time capsule, Thống kê chi tiêu nâng cao (theo địa điểm, theo mood, xuất báo cáo), Wrapped cả năm + nhiều mẫu thẻ + **tắt được** watermark/QR, xuất PDF "cuốn sách kỷ niệm", 9 ảnh/kỷ niệm chất lượng cao.
   - **Chuỗi copy:** khi copy từ `Dating_Journal_v2.md`, **bỏ** các chuỗi/cụm liên quan Plus (liệt kê ở trên). Câu chữ còn lại phải đọc tự nhiên, không để lại câu cụt. Không dùng từ "Plus", "Premium", "nâng cấp", "gói", "miễn phí vs trả phí" ở bất kỳ UI, thông báo, email, push, prompt AI hay landing nào. Khi cần nói về giới hạn chống lạm dụng, dùng câu trung tính: *"Hôm nay bạn đã dùng hết lượt, quay lại vào ngày mai nhé."*
   - **Landing:** giữ nguyên các section còn lại; bỏ hẳn section giá, không thay bằng câu nào nói về phí/miễn phí. Không hiển thị giá.
2. **Hạn mức chống lạm dụng vẫn giữ** (vì Gemini tốn chi phí) nhưng **không** gắn với gói và hiển thị trung tính: Cupid 200 tin/ngày/user, Khám phá 30 lượt/ngày/user. Không hiện bộ đếm "7 trên 10" (bỏ khỏi UI Cupid và Khám phá "Còn 1 lượt hôm nay"); chỉ hiện thông báo khi chạm trần.
3. **Font mặc định: Be Vietnam Pro** (cả heading và body). Chi tiết ở T0.9 (làm ngay ở P0 vì ảnh hưởng toàn UI).

---

## 0. Quy tắc làm việc (bắt buộc)

1. **Đọc `AGENTS.md` / `CLAUDE.md` trước.** Repo dùng **Next.js 16.3.5 + React 19.2** có breaking changes. Trước khi viết code Next, đọc guide liên quan trong `node_modules/next/dist/docs/`. Điểm đã thấy trong code: `proxy.ts` (thay middleware), `RouteContext<'/api/...'>` + `await ctx.params`, Tailwind v4 (tokens trong `app/globals.css`), `next-auth@5.0.0-beta.32`.
2. **Expand → Migrate → Contract.** Không drop cột/bảng cũ trong cùng release với cột/bảng mới. Việc drop nằm ở Phase 13 (P13-CONTRACT).
3. **Mỗi Phase = 1 branch/PR** (`v2/p<N>-<slug>`), mỗi task = 1 commit (`feat(p2): T2.3 ...`). Sau mỗi task chạy: `npm run lint && npx tsc --noEmit && npm run build`. Phải xanh mới sang task kế.
4. **Migration:** thêm file mới trong `supabase/migrations/`, tên `202611xxxxxxxx_<slug>.sql` (lớn hơn `20261020000000`). Idempotent (`if not exists`, `drop policy if exists`). Không sửa migration cũ. Mọi bảng mới **phải bật RLS** và có policy; bảng nhạy cảm chỉ truy cập qua service role/RPC thì `revoke all ... from anon, authenticated`.
5. **Pattern truy cập dữ liệu hiện có (giữ nguyên):** client đọc/ghi bằng `createClient()` (`lib/supabase/client.ts`, JWT do server ký → RLS có `auth.uid()`); server dùng `createClient(user)` (RLS). `createAdminClient()` (bypass RLS) chỉ dùng khi có lý do ghi trong comment và **luôn kiểm tra membership trước**.
6. **Query keys** chỉ khai báo trong `lib/query/keys.ts`. Server prefetch qua `getServerQueryClient` như `app/(app)/layout.tsx`. Cache bị xoá khi đổi user bởi `AuthCacheGuard` — đừng bỏ.
7. **Tiền:** số nguyên VND (`bigint`/`integer`), hiển thị `Intl.NumberFormat('vi-VN')` + `đ`. **Thời gian:** ranh giới "ngày" luôn theo `Asia/Ho_Chi_Minh` (dùng `@date-fns/tz` `TZDate`; tạo `lib/time.ts`). Không dùng `new Date().toISOString().slice(0,10)` để tính "hôm nay".
8. **UI:** dùng token sẵn có (`bg-surface`, `text-text-muted`, `var(--radius-lg)`, `font-heading`), component trong `components/ui/*`. Component UI mới phải có `*.stories.tsx`. Tối thiểu 44×44px vùng chạm, mobile-first (PWA). Mọi màu chữ đạt tương phản ≥ 4.5:1 (xem T12.3).
9. **Không `any` ở code mới.** Zod validate mọi input API. Mọi lỗi API trả `{ error: string }` tiếng Việt, mã HTTP đúng.
10. **Test:** thêm vitest *unit project* (hiện `vitest.config.ts` chỉ có project storybook) — xem T0.8. Logic thuần (milestone, streak, spend stats, quota, sanitize share, invite token, contrast) **phải có unit test**.
11. **Không log** nội dung riêng tư (ảnh, ghi chú, câu trả lời, nội dung chat) ra console/Sentry.

---

## 1. Hiện trạng v1 (đã đọc source)

**Stack:** Next 16 App Router · React 19 · TanStack Query 5 · Supabase (Postgres + Storage; **không dùng Supabase Auth nữa**) · NextAuth v5 (JWT, Google + Credentials) tự ký JWT cho PostgREST (`lib/auth/supabase-token.ts`) · Gemini (`@google/genai`, fallback nhiều model) · Tailwind 4 · Storybook/Vitest · PWA manifest (không có service worker).

**Route hiện có:** `/` (redirect `/dashboard`), `/(auth)/login|signup`, `/(app)/dashboard|dates|dates/new|dates/[id]|dates/[id]/edit|insights|chat|settings|couple/setup`.
**API hiện có:** `auth/[...nextauth]`, `register`, `profile`, `couples`, `couples/join`, `dates`, `dates/[id]`, `upload`, `supabase-token`, `ai/chat`, `ai/reading`.
**Bảng:** `auth_users`, `auth_accounts`, `auth_login_attempts`, `profiles`, `couples` (`invite_code` vĩnh viễn, `anniversary_date`, `relationship_status`), `couple_members` (`nickname` = biệt danh *đặt cho* member đó), `nicknames` (dư), `dates` (`location_name/lat/lng`, `date_time`, `end_date`, `checkin_image_url(s)`, `pros/cons/wish_next_time/rating`), `user_preferences`, `ai_readings` (numerology|zodiac|tarot|palm), `ai_chat_sessions/messages`.
**Storage:** `avatars` (public), `checkin-images` (**public**, URL public lưu thẳng vào `dates.checkin_image_urls`).
**Theme:** 8 palette + 5 font pair (`lib/theme/theme-presets.ts`), i18n vi/en (`lib/i18n/translations.ts`), `/api/upload` nén client (`lib/image/image-compress.ts`).

### Vấn đề phát hiện (xử lý ở P0, ưu tiên cao)

| # | Vấn đề | Vị trí | Mức |
|---|---|---|---|
| S1 | `POST /api/dates` dùng **admin client** và nhận `couple_id` từ body, **không kiểm membership** → ghi được vào couple người khác (IDOR) | `app/api/dates/route.ts` | 🔴 |
| S2 | Bucket `checkin-images` public + policy `checkin_authenticated_read` cho *mọi user đã đăng nhập* đọc; URL public lưu DB → "đường dẫn có hạn" của v2 không thể đạt | migration init, `app/api/upload/route.ts` | 🔴 |
| S3 | `invite_code` sinh bằng `Math.random`, vĩnh viễn, không rate-limit, không hết hạn; join check `count>=2` có race | `app/api/couples*` | 🔴 |
| S4 | Giới hạn 2 thành viên chỉ ở tầng app, DB không chặn | schema | 🟠 |
| S5 | `created_by`/`given_by`… FK tới `profiles` **không `ON DELETE`** → không xoá được tài khoản (v2 yêu cầu) | schema | 🟠 |
| S6 | 6/8 palette **không** đạt tương phản 4.5:1 cho chữ trên nút (đo: rose 2.74, ocean 2.77, sunset 2.80, forest 2.54, peach 2.26, midnight 4.47; chỉ cherry 4.70 đạt, lavender 4.23 trượt) | `lib/theme/theme-presets.ts` | 🟠 |
| S7 | `images.remotePatterns` cho `**` mọi host; chưa có CSP/security headers | `next.config.ts` | 🟡 |
| S8 | Upload không kiểm magic bytes, không scope path theo couple | `app/api/upload/route.ts` | 🟡 |

---

## 2. Gap analysis: v2 vs v1

| Hạng mục v2 (theo spec) | v1 | Việc cần làm | Phase |
|---|---|---|---|
| Landing công khai (hero, 6 tính năng, riêng tư, 3 bước, giá) | `/` redirect | Trang mới + `/privacy` `/terms` `/contact` | P1 |
| Đăng nhập Google **+ Apple + link email (15 phút)** + email/mật khẩu | Google + password | Thêm Apple, magic link | P1 |
| Giới hạn tuổi ≥16, consent | không | Onboarding | P1 |
| Onboarding "Mình làm quen một chút nhé" | không | `/onboarding` | P1 |
| "Bạn muốn làm gì?" → Tạo couple / Nhập mã | `/couple/setup` gộp | Tách luồng | P1 |
| Link mời 1 lần, 48h, thu hồi, mã 6 ký tự (≤5 lần sai), màn chờ, màn xem trước lời mời | mã vĩnh viễn | Hệ invite mới | P1 |
| Ghi nhanh 10 giây (ảnh/video, mood, 1 dòng) | form dài (địa điểm bắt buộc) | Form mới, địa điểm tuỳ chọn | P2 |
| Nhiều địa điểm / buổi hẹn, tag, chi tiêu, bài hát, ai trả | 1 địa điểm | Bảng `date_places`, cột mới | P2 |
| Ảnh riêng tư, link có hạn, tối đa 9 ảnh | public, tối đa 9 | Private bucket + proxy | P2 |
| Bản nháp offline ("Mạng hơi yếu") | không | IndexedDB draft | P2 |
| Home mới (cảnh báo mốc, bộ đếm + biệt danh, câu hỏi, lịch có số ngày yêu, ngày này năm ngoái, mốc, gần đây, wishlist, chi tiêu) | counter + calendar + 2 nút | Dựng lại | P3 |
| Reaction + bình luận + "đã xem" | không | Bảng + UI | P4 |
| Câu hỏi hằng ngày + chuỗi | không | Bảng + RLS mở khoá khi cả hai xong | P4 |
| Wishlist "Cùng nhau" | không | Bảng + UI | P4 |
| Chi tiêu + ngân sách | không | RPC thống kê + UI | P5 |
| Bản đồ kỷ niệm + hành trình nhiều điểm | không | Leaflet + geocode proxy | P5 |
| Khoá app PIN/sinh trắc, ẩn đa nhiệm | không | Client lock | P6 |
| Xuất ZIP, rời couple 2 bước (giữ 30 ngày), xoá tài khoản | không | Vòng đời dữ liệu | P6 |
| Thông báo đẩy + giờ yên lặng | không | Web Push + cron | P7 |
| Cupid theo ngân sách & wishlist, trần chống lạm dụng | không giới hạn | Quota nội bộ + prompt | P9 |
| Khám phá: chia sẻ kết quả cho người ấy, trần chống lạm dụng | không giới hạn | Quota nội bộ + cờ chia sẻ | P9 |
| Wrapped tháng/năm + thẻ chia sẻ 1080×1920 + watermark/QR | không | `next/og` | P10 |
| Time capsule | không | RPC khoá phía server | P11 |
| Quiz ngôn ngữ tình yêu | không | Bảng + nội dung | P11 |
| Cài đặt chia mục, font mặc định Be Vietnam Pro, tương phản 4.5:1 | 2 tab | Tách route con | P12 (+P0 cho font) |

---

## 3. Quyết định mặc định (không cần hỏi lại)

| # | Chủ đề | Quyết định |
|---|---|---|
| D1 | Email/mật khẩu | **Giữ** để không phá user cũ; thêm Apple + magic link. Màn login: nút Google/Apple → "hoặc dùng email" → tab *Link qua email* (mặc định) / *Mật khẩu*. |
| D2 | Magic link | Tự cài (không NextAuth Email provider vì repo không dùng adapter): bảng `auth_login_tokens`, provider Credentials thứ 2 id `magic-link`, token hash SHA-256, TTL 15 phút, dùng 1 lần, xác thực qua **trang trung gian có nút/POST** (chống email scanner tự mở link). Gửi mail qua Resend (`lib/email`). |
| D3 | Mã mời & link | Token 10 ký tự Crockford base32 (hiển thị `xxxx-xxxx-xx`), mã 6 ký tự **độc lập** với token. Hạn 48h, 1 lần, thu hồi được. "Sai tối đa 5 lần" = 5 lần nhập mã sai/ người dùng/ 15 phút (khoá tạm), + giới hạn theo IP. |
| D4 | Ảnh/video | Bucket `checkin-images` **đổi sang private tại chỗ** (không copy file). Truy cập qua proxy `/api/media/[id]` → 302 tới signed URL TTL 60s, `Cache-Control: private, max-age=300`. Tối đa **9** mục media/kỷ niệm cho mọi người; video tối đa 1/kỷ niệm, ≤50MB, ≤30s. Nén chất lượng cao cho tất cả (0.9, cạnh dài 2560). |
| D5 | Trường cũ `pros/cons/wish_next_time/rating` | **Giữ cột và dữ liệu**, ẩn trong khối "Thêm chi tiết" thu gọn ở form; vẫn hiển thị ở trang chi tiết nếu có. Ghi nhanh chỉ cần 1 ảnh **hoặc** 1 dòng. |
| D6 | "Ghi chú riêng" trên thẻ chia sẻ | Mọi text tự do (`note`, `pros`, `cons`, `wish_next_time`, comment) coi là riêng tư. Thẻ chia sẻ dùng **whitelist** field (T10.1), không blacklist. |
| D7 | Rời couple | Người rời mất quyền truy cập; couple chuyển `dissolved`, `purge_after = now()+30d`; cả hai vào chế độ **chỉ xem + xuất** trong 30 ngày; cron xoá vĩnh viễn sau đó. Bắt buộc 2 bước xác nhận + gợi ý xuất trước. |
| D8 | Xoá tài khoản | Xoá ngay dữ liệu cá nhân (profile, ảnh avatar, ai_readings, câu trả lời, quiz, push, auth_*). Dữ liệu chung → couple `dissolved` 30 ngày như D7. |
| D9 | Câu hỏi hằng ngày | Mỗi couple một câu/ngày (lấy lười từ ngân hàng ≥365 câu, không lặp trong 365 ngày). Chỉ trả lời **trong ngày** (theo `Asia/Ho_Chi_Minh`); sửa được đến khi cả hai xong; xong cả hai mới mở. Chuỗi = số ngày liên tiếp cả hai cùng trả lời. |
| D10 | Hạn mức chống lạm dụng | Cupid 200 tin/ngày/user. Khám phá 30 lượt/ngày/user (tổng 4 loại, kết quả cache 24h **không** trừ lượt). Reset 00:00 giờ VN. Không hiển thị bộ đếm; chỉ báo khi chạm trần. Cấu hình ở `lib/limits.ts`. |
| D11 | Thanh toán | **Loại khỏi phạm vi.** Không code billing. Nếu sau này cần, thiết kế lại từ đầu. |
| D12 | Bản đồ | Leaflet + tile OSM. Geocode/autocomplete qua server proxy `/api/places/search`: dùng Goong nếu có `GOONG_API_KEY`, ngược lại Nominatim (kèm User-Agent, throttle 1 req/s). Trang bản đồ mở cho tất cả. |
| D13 | Thông báo | Web Push (VAPID) + service worker `public/sw.js`. iOS cần "Thêm vào Màn hình chính" (đã có copy trong spec). Lịch gửi bằng cron endpoint có `CRON_SECRET` gọi mỗi 15 phút (Supabase `pg_cron`+`pg_net`, hoặc Vercel Cron nếu plan cho phép). Nhắc câu hỏi 21:00 chỉ gửi nếu user **chưa** trả lời. |
| D14 | Khoá app | Khoá **theo thiết bị** (localStorage/IndexedDB), PIN 4–6 số hash PBKDF2, sinh trắc qua WebAuthn platform authenticator làm "gate" cục bộ. Quên PIN → đăng xuất rồi đăng nhập lại. Đây là khoá giao diện, không phải mã hoá dữ liệu — ghi rõ trong comment. |
| D15 | Ẩn ở màn hình đa nhiệm | Best-effort: overlay mờ khi `visibilitychange→hidden`/`pagehide`. Không hứa hẹn tuyệt đối trên iOS. |
| D16 | IA điều hướng | Mobile tab bar: **Trang chủ · Hẹn hò · ➕ Ghi nhanh (nút giữa) · Cupid · Thêm**. "Thêm" mở trang hub: Cùng nhau, Câu hỏi hằng ngày, Chi tiêu, Bản đồ, Time capsule, Quiz, Khám phá, Wrapped, Cài đặt. Desktop: top nav cùng mục. Avatar → Cài đặt. |
| D17 | Đếm ngày | **Giữ quy ước v1** (ngày bắt đầu yêu = ngày 1, `daysCount = diff+1`). Số mẫu trong spec (414/còn 86) có thể không khớp; đừng đổi công thức. |
| D21 | Font | Mặc định **Be Vietnam Pro** cho heading + body (hỗ trợ đầy đủ dấu tiếng Việt). Giữ các font pair khác trong bộ chọn; đổi pair `classic` (Playfair+Inter) thành lựa chọn phụ, không còn là mặc định. |
| D22 | Không nhắc Plus | Xem mục 00. Không để lại bất kỳ chuỗi Plus nào ở UI/email/push/prompt. |
| D18 | Màu chủ đạo tuỳ ý | Cho chọn palette hoặc hex tuỳ ý; luôn đi qua `ensureAccessible()` (T12.3) để đảm bảo ≥4.5:1. |
| D19 | Ngôn ngữ | Spec là tiếng Việt → `vi` là chuẩn. Thêm key `en` bản nháp tự dịch; không chặn release. |
| D20 | Nội dung pháp lý | `/privacy`, `/terms` viết bản nháp bám đúng các cam kết trong spec (30 ngày, ZIP, xoá được, ≥16 tuổi). 🛑 Cần luật sư duyệt trước production. |

---

## 4. Kiến trúc đích

### 4.1 Route map (spec → route → file)

| Màn hình trong spec | Route | File chính |
|---|---|---|
| Landing | `/` (public) | `app/page.tsx`, `components/landing/*` |
| Đăng nhập / đăng ký | `/login`, `/signup`, `/auth/magic` | `app/(auth)/*` |
| "Mình làm quen một chút nhé" | `/onboarding` | `app/(onboarding)/onboarding/page.tsx` |
| "Bạn muốn làm gì?" | `/couple/setup` | `app/(app)/couple/setup/page.tsx` (rewrite) |
| "Tạo couple mới" | `/couple/new` | mới |
| "Gửi lời mời cho người ấy" | `/couple/invite` | mới |
| "Nhập mã mời" | `/couple/join` | mới |
| "Minh Anh mời bạn…" | `/join/[token]` | `app/join/[token]/page.tsx` (cần login, giữ `next`) |
| "Nhập mã để mở app" | overlay `<AppLock/>` | `components/security/app-lock.tsx` |
| Home | `/dashboard` (giữ URL) | `app/(app)/dashboard/page.tsx` |
| Buổi hẹn hò + tìm kiếm | `/dates` | giữ + search |
| Ngày này năm ngoái | `/dates/on-this-day` | mới |
| Buổi hẹn mới / sửa | `/dates/new`, `/dates/[id]/edit` | `components/features/date-form.tsx` (rewrite) |
| Cùng nhau (wishlist) | `/together` | mới |
| Câu hỏi hằng ngày | `/daily` | mới |
| Chi tiêu buổi hẹn | `/spending` | mới |
| Bản đồ kỷ niệm | `/map` | mới |
| Time capsule | `/capsules`, `/capsules/new` | mới |
| Quiz ngôn ngữ tình yêu | `/quiz` | mới |
| Cupid | `/chat` (giữ URL) | `app/(app)/chat/page.tsx` |
| Khám phá tình yêu | `/insights` (giữ URL) | giữ + quota |
| Wrapped, Thẻ chia sẻ | `/wrapped`, `/wrapped/share` | mới |
| Cài đặt (+ Giao diện, Riêng tư, Thông báo) | `/settings`, `/settings/appearance`, `/settings/privacy`, `/settings/notifications`, `/settings/couple`, `/settings/data` | tách từ `settings-dashboard.tsx` |
| Hub "Thêm" | `/more` | mới |

`proxy.ts`: thêm các route app mới vào `APP_ROUTES`; `/`, `/join/*`, `/privacy`, `/terms`, `/contact`, `/auth/magic` là public (nhưng `/join/*` redirect login kèm `?next=`). User đã login nhưng chưa `onboarded_at` → redirect `/onboarding` (kiểm trong `(app)/layout.tsx`, không kiểm ở proxy vì cần DB).

### 4.2 Data model — migrations theo thứ tự

> Tên file gợi ý; timestamp tăng dần. Chỉ liệt kê cột/ràng buộc quan trọng — agent tự viết đầy đủ SQL.

**M1 `20261101000100_v2_core_security.sql`** (P0)
- Trigger `enforce_max_two_members` trên `couple_members` (BEFORE INSERT: `count(*) >= 2 → raise`). Dùng advisory lock theo `couple_id` để hết race.
- Sửa FK `created_by/given_by/given_to` → `ON DELETE SET NULL` (couples, dates, nicknames, ai_chat_sessions).
- `couples`: thêm `timezone text default 'Asia/Ho_Chi_Minh'`, `monthly_budget_vnd bigint`, `dissolved_at timestamptz`, `purge_after timestamptz`.
- `couple_members`: thêm `left_at timestamptz`.
- `profiles`: thêm `onboarded_at timestamptz`, `consent_at timestamptz`, `consent_version text`, `primary_color` giữ ở `user_preferences`.
- Storage: `update storage.buckets set public=false where id='checkin-images'`; **drop** mọi policy `checkin_*` trên `storage.objects` (client không đụng storage trực tiếp; chỉ service role ký/ghi).
- Bảng **`usage_counters`**(`scope uuid` (profile_id hoặc couple_id), `feature text`, `day date`, `count int`, pk `(scope,feature,day)`) + RPC `consume_quota(p_scope uuid, p_feature text, p_day date, p_limit int) returns boolean` (atomic `insert … on conflict do update … where count < limit returning`), RPC `refund_quota(...)`. `revoke` trực tiếp, chỉ gọi RPC từ server.
- Bảng **`rate_limits`**(`key text`, `window_start timestamptz`, `count int`) hoặc tái dùng `auth_login_attempts` (mở rộng `kind`) cho invite/magic.

**M2 `…_invites.sql`** (P1)
```sql
create table public.couple_invites (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null,
  token_hash text not null unique,        -- sha256(token)
  code_hash  text not null,               -- sha256(code), KHÔNG unique toàn cục; tra cứu theo code + active
  code_hint  text not null,               -- 2 ký tự đầu để hiển thị/debug, không dùng xác thực
  message    text check (char_length(message) <= 140),
  expires_at timestamptz not null default now() + interval '48 hours',
  used_at timestamptz, used_by uuid references profiles(id) on delete set null,
  revoked_at timestamptz, created_at timestamptz default now()
);
create index on couple_invites (code_hash) where used_at is null and revoked_at is null;
-- RLS bật; chỉ member của couple được SELECT (không trả hash cho client: dùng view/RPC); INSERT/UPDATE qua service role.
```
- RPC `redeem_invite(p_user uuid, p_token_hash text default null, p_code_hash text default null) returns uuid` `SECURITY DEFINER`, chạy trong 1 transaction: `select … for update` invite hợp lệ (chưa dùng, chưa thu hồi, chưa hết hạn) → kiểm user chưa thuộc couple nào, không phải người tạo → insert `couple_members(role='member')` → set `used_at/used_by`. Mọi sai khác trả lỗi có mã (`invite_invalid`, `invite_expired`, `couple_full`, `already_in_couple`, `self_invite`).
- Bảng `invite_attempts(id, profile_id, ip, success, created_at)` cho rate limit.
- Backfill: couple 1 thành viên đang có `invite_code` cũ → không tạo invite tự động; trang `/couple/invite` tự tạo khi chưa có invite active.

**M3 `…_profile_onboarding.sql`** (P1)
- Backfill `profiles.onboarded_at = created_at` cho user hiện có **đã có** `birth_date`; user chưa có `birth_date` sẽ qua onboarding bổ sung (không khoá app, chỉ nhắc ở lần đăng nhập tới).
- `auth_login_tokens(id, email, token_hash unique, expires_at, used_at, ip, created_at)` (RLS bật, không policy, revoke all) + mở rộng `auth_login_attempts.kind` thêm `'magic'`.

**M4 `…_dates_v2.sql`** (P2)
```sql
alter table dates
  add column title text, add column note text, add column mood text
    check (mood in ('love','happy','calm','excited','tired','sad')),
  add column spend_vnd bigint check (spend_vnd >= 0),
  add column paid_by uuid references profiles(id) on delete set null,
  add column paid_split boolean not null default false,
  add column song text, add column tags text[] not null default '{}',
  add column updated_at timestamptz default now(),
  add column client_id uuid unique;   -- idempotency cho bản nháp offline
create table date_places (
  id uuid pk default gen_random_uuid(), date_id uuid not null references dates(id) on delete cascade,
  position int not null, name text not null, lat double precision, lng double precision,
  area_label text,                      -- "Quận 1", "Đà Lạt" — dùng cho thẻ chia sẻ thay cho địa điểm chính xác
  unique (date_id, position));
create table date_media (
  id uuid pk default gen_random_uuid(), date_id uuid not null references dates(id) on delete cascade,
  couple_id uuid not null references couples(id) on delete cascade,
  kind text not null check (kind in ('image','video')), path text not null,   -- trong bucket checkin-images
  thumb_path text, width int, height int, duration_s int, bytes int,
  position int not null default 0, created_by uuid references profiles(id) on delete set null, created_at timestamptz default now());
```
- Cả hai bảng: RLS `couple_id in (select get_user_couple_ids())` (qua `dates` cho `date_places`). Trigger kiểm số media/kỷ niệm (≤9, ≤1 video).
- `dates.location_name` **bỏ NOT NULL logic ở validate** (cột vốn nullable). Giữ `location_*` = địa điểm đầu tiên (đồng bộ bằng trigger/ở API) để code cũ còn chạy.
- **Backfill (script, không phải SQL thuần):** `scripts/backfill-v2-media.mjs` — parse `checkin_image_urls`/`checkin_image_url` → `path` (`/object/public/checkin-images/<path>`), insert `date_media`; tạo `date_places` từ `location_*`. Idempotent, có `--dry-run`.
- RPC `on_this_day(p_couple uuid, p_day date)`; RPC `dates_by_day_range(...)` cho lịch (trả cả ngày nằm giữa `date_time..end_date`).

**M5 `…_social.sql`** (P4)
- `date_reactions(date_id, profile_id, emoji default '💗', created_at, pk(date_id, profile_id))`
- `date_comments(id, date_id, author_id → set null, body check ≤500, created_at, edited_at, deleted_at)`
- `date_views(date_id, profile_id, seen_at, pk(date_id, profile_id))`
- RLS: member của couple; chỉ tác giả sửa/xoá comment/reaction của mình.

**M6 `…_daily_questions.sql`** (P4)
- `questions(id serial pk, text_vi, text_en, category, active default true)` — seed ≥365 câu vi (3 câu mẫu trong spec là câu seed số 1–3).
- `couple_daily_questions(couple_id, day date, question_id, pk(couple_id,day))` tạo lười qua RPC `get_or_create_today_question(p_couple)`.
- `daily_answers(couple_id, day, profile_id, body check ≤300, answered_at, pk(couple_id,day,profile_id))`.
- **RLS quan trọng:** SELECT cho phép khi `profile_id = auth.uid()` **hoặc** (member của couple **và** tồn tại câu trả lời của chính `auth.uid()` cho cùng `(couple_id,day)`). INSERT/UPDATE chỉ chính chủ, chỉ khi `day = (now() at time zone 'Asia/Ho_Chi_Minh')::date`; UPDATE chỉ khi partner chưa trả lời.
- RPC `get_streak(p_couple uuid) returns int`.

**M7 `…_wishlist.sql`** (P4): `wishlist_items(id, couple_id, title not null ≤120, note, budget_vnd, created_by, done_at, done_by, linked_date_id, created_at)` + RLS member.

**M8 `…_push.sql`** (P7): `push_subscriptions(id, profile_id, endpoint unique, p256dh, auth, ua, created_at, last_seen_at)`; `notification_prefs(profile_id pk, reactions bool default true, weekend_reminder bool default true, daily_question bool default true, milestones bool default true, on_this_day bool default true, quiet_enabled bool default false, quiet_start time default '22:00', quiet_end time default '07:00')`; `notification_log(id, profile_id, kind, ref, sent_at)` (dedupe).

**M9 `…_capsules_quiz.sql`** (P11)
- `time_capsules(id, couple_id, author_id, title ≤80, body text, media_paths text[], unlock_on date not null, opened_at, created_at)`. **RLS: không có policy SELECT cho authenticated** (revoke). Truy cập qua RPC `list_capsules(p_couple)` (SECURITY DEFINER, kiểm membership) trả `body = null, media = []` cho đến khi `unlock_on <= hôm nay (giờ VN)` — **kể cả với tác giả**. Ảnh capsule chỉ được ký URL từ server sau khi RPC xác nhận đã mở.
- `love_quiz_results(couple_id, profile_id, scores jsonb, completed_at, pk(couple_id,profile_id))`; RLS giống `daily_answers` (đối phương chỉ thấy khi mình đã xong).

**M10 — BỎ** (billing nằm ngoài phạm vi, xem mục 00). Số thứ tự M10 để trống.

**M11 `…_lifecycle.sql`** (P6): `export_jobs(id, profile_id, status, path, bytes, created_at, expires_at)` (nếu làm job), hàm `purge_dissolved_couples()` (xoá storage + dữ liệu `couples` với `purge_after < now()`).

### 4.3 Biến môi trường mới (`.env.example` — repo hiện **chưa có** file này, hãy tạo)

```
# đã có
AUTH_SECRET AUTH_URL AUTH_GOOGLE_ID AUTH_GOOGLE_SECRET SUPABASE_JWT_SECRET|SUPABASE_JWT_PRIVATE_JWK
NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY GEMINI_API_KEY
# mới
APP_URL=https://dj.app                 # dùng cho link mời, QR, email
AUTH_APPLE_ID  AUTH_APPLE_SECRET       # secret là JWT ES256 sinh từ .p8, hết hạn ≤6 tháng → script T1.3
RESEND_API_KEY  EMAIL_FROM
CRON_SECRET
VAPID_PUBLIC_KEY  VAPID_PRIVATE_KEY  VAPID_SUBJECT
NEXT_PUBLIC_VAPID_PUBLIC_KEY
GOONG_API_KEY  (tuỳ chọn)
```

### 4.4 Thư viện dự kiến thêm
`@date-fns/tz`, `resend`, `web-push`, `leaflet` + `react-leaflet`, `fflate` (ZIP streaming), `qrcode`, `@simplewebauthn/browser` *(chỉ nếu dùng; có thể gọi `navigator.credentials` trực tiếp)*, `vitest` project node (đã có vitest). Mọi lib thêm phải kèm lý do ở message commit.

---

## 5. Phases & Tasks

**Thứ tự & phụ thuộc:** P0 → P1 → P2 → P3 → (P4, P5 song song được) → P6 → P7 → P9 → P10 → P11 → P12 → P13. *(P8 đã bị loại — xem mục 00.)* Widget của Home (P3) chỉ thêm khi tính năng tương ứng xong (ghi ở từng phase).

### P0 — Nền tảng, vá bảo mật, font

**T0.1 Migration M1.** Viết `20261101000100_v2_core_security.sql` theo mục 4.2 (không có entitlements). Chạy `supabase db reset` cục bộ nếu có; nếu không, kiểm cú pháp bằng `psql`/review.
- AC: thêm member thứ 3 vào couple bị DB từ chối; `checkin-images` `public=false`; không còn policy `checkin_*`.

**T0.2 Sửa S1 (IDOR).** `app/api/dates/route.ts`: bỏ `process.env.SUPABASE_SERVICE_ROLE_KEY ? admin : supabase`. Dùng `supabase` (RLS) cho GET/POST (policy `dates_insert` đã kiểm `created_by` và couple). Nếu giữ admin vì lý do hiệu năng thì **bắt buộc** kiểm `couple_members` trước khi ghi. Áp dụng tương tự `app/api/upload/route.ts`.
- AC: unit/integration test: user A POST với `couple_id` của B → 403/42501, không có row mới.

**T0.3 Sửa S3/S4.** Vô hiệu `app/api/couples/join/route.ts` (trả 410 + thông báo dùng luồng mới, hoàn thiện ở P1). `app/api/couples/route.ts`: bỏ sinh `invite_code` bằng `Math.random` (dùng `crypto.randomInt`/`randomBytes`), vẫn điền cột cũ NOT NULL bằng giá trị ngẫu nhiên không dùng đến.

**T0.4 Quota nội bộ.** Tạo `lib/limits.ts` (`CUPID_PER_DAY=200`, `READING_PER_DAY=30`), `lib/quota.ts` gọi RPC `consume_quota`/`refund_quota` bằng admin client, trả `{ ok: boolean }`. Tạo `lib/time.ts` (`todayVN()`, `startOfDayVN()`, `formatVN()` dùng `@date-fns/tz`).
- AC: unit test `consume_quota` logic ở lớp TS (mock) + test SQL thủ công: gọi 201 lần → lần 201 `ok=false`.

**T0.5 Security headers & ảnh.** `next.config.ts`: CSP (cho phép `self`, Supabase storage host, tile OSM/Goong, `data:`/`blob:` cho ảnh), `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera cho chụp ảnh; `geolocation=(self)`). Giới hạn `images.remotePatterns` còn `*.supabase.co`, `lh3.googleusercontent.com`, host Goong nếu có.

**T0.6 `.env.example`** theo mục 4.3 và cập nhật README (mục Environment Variables).

**T0.7 Layout "shell" dùng chung.** Tạo `components/layouts/page-header.tsx` (tiêu đề + mô tả + action), `components/ui/bottom-sheet.tsx`, `components/ui/segmented-tabs.tsx`, `components/ui/switch.tsx`, `components/ui/progress.tsx`, `components/ui/chip.tsx` (mood/tag). Mỗi cái có stories. Dùng lại token hiện có.

**T0.8 Test harness.** Thêm project `unit` trong `vitest.config.ts` (`environment: 'node'`, include `**/*.test.ts`), script `"test": "vitest run --project unit"`. Viết test mẫu cho `lib/time.ts`.

**T0.9 Font mặc định Be Vietnam Pro.**
- `app/layout.tsx`: bỏ `Inter`, `Playfair_Display` khỏi mặc định; thêm `Be_Vietnam_Pro({ weight:['400','500','600','700'], subsets:['vietnamese','latin'], variable:'--font-be-vietnam', display:'swap' })`. Giữ Inter/Playfair **chỉ** nếu còn font pair cần (khi đó nạp qua `loadGoogleFont` như các pair khác — xoá khỏi `layout.tsx` để giảm tải).
- `app/globals.css`: `--font-heading: var(--font-be-vietnam); --font-body: var(--font-be-vietnam);` (sửa dòng 34–35; kiểm dòng 90–91 không tự tham chiếu vòng).
- `lib/theme/theme-presets.ts`: thêm `FONT_PAIRS[0] = { id:'default', name:'Be Vietnam Pro', heading:'Be Vietnam Pro', body:'Be Vietnam Pro', googleFontsQuery:'' /* đã nạp bằng next/font */ }`; đổi `classic` thành `googleFontsQuery` đầy đủ cho Playfair+Inter; `getDefaultPreferences()` → `font_heading/font_body: 'Be Vietnam Pro'`.
- `components/providers/theme-provider.tsx` dòng ~54–55 và ~106–109: đổi mọi fallback `'Playfair Display'`/`'Inter'` → `'Be Vietnam Pro'`.
- Migration `20261101000200_default_font_be_vietnam.sql`: `alter table user_preferences alter column font_heading set default 'Be Vietnam Pro', alter column font_body set default 'Be Vietnam Pro';` và `update user_preferences set font_heading='Be Vietnam Pro', font_body='Be Vietnam Pro' where font_heading='Playfair Display' and font_body='Inter';` (user còn dùng cặp mặc định cũ chuyển sang mặc định mới; user đã chọn cặp khác giữ nguyên).
- AC: user mới và user chưa đổi font thấy Be Vietnam Pro ở mọi màn; dấu tiếng Việt hiển thị đúng ("ệ", "ữ", "ẫ"); chọn lại pair khác vẫn hoạt động; không còn request tới Google Fonts khi dùng mặc định (next/font self-host).
- Ghi chú cho P10: font TTF dùng cho thẻ `next/og` cũng là Be Vietnam Pro (xem T10.2).

### P1 — Landing, Auth, Onboarding, Couple & Invite

**T1.1 Landing `/`.** `app/page.tsx` (Server Component, public): nếu đã đăng nhập → nút "Mở app" thay CTA (không redirect cưỡng bức). Dựng đúng thứ tự spec: Hero ("Không gian riêng của *hai đứa*…", "Cho cặp đôi 16–25 tuổi"), "Mọi thứ hai bạn cần, không thừa thứ nào" (6 card: Ghi nhanh 10 giây · Thả tim cho nhau · Lịch đếm ngày yêu · Câu hỏi mỗi ngày · Cupid và Khám phá · Wrapped để khoe), "Riêng tư nhìn thấy được" (3 chip), "Bắt đầu mất 3 phút" (3 bước), footer (Chính sách quyền riêng tư · Điều khoản · Liên hệ). **Bỏ** link "Gói Plus" ở header, **bỏ** section giá (không thay bằng câu nào nói về phí). Sửa câu "Phần cốt lõi luôn miễn phí: ghi kỷ niệm, đếm ngày, reaction và wishlist." → "Ghi kỷ niệm, đếm ngày, reaction và wishlist, tất cả đều sẵn sàng." Metadata/OG đầy đủ, `manifest.ts` `start_url` giữ `/dashboard`.
- AC: Lighthouse mobile Performance ≥ 90, A11y ≥ 95; không còn chuỗi "Plus"/"39.000".

**T1.2 Trang pháp lý.** `/privacy`, `/terms`, `/contact` (bản nháp, mục D20). Nội dung nêu: dữ liệu thu thập, thời hạn 30 ngày, xuất/xoá, ≥16 tuổi, AI (Gemini) xử lý ảnh bàn tay/ nội dung chat.

**T1.3 Apple Sign In.** `auth.ts`: thêm `Apple` provider; tổng quát `upsertGoogleUser` → `upsertOAuthUser(provider, profile)` trong `lib/auth/users.ts` (giữ logic chống pre-hijack: chỉ liên kết theo email nếu email do provider xác thực; Apple có thể trả email relay & `email_verified` dạng chuỗi `"true"`; tên chỉ có ở lần đầu → lưu ngay). Script `scripts/generate-apple-secret.mjs` sinh client secret ES256 từ `.p8` (nhắc hạn 6 tháng trong README). Nút "Đăng nhập với Apple" cạnh Google (`components/features/apple-sign-in-button.tsx`).
- AC: đăng nhập Apple tạo `auth_users`+`auth_accounts(provider='apple')`+`profiles`; đăng nhập lại cùng `sub` ra cùng user.

**T1.4 Magic link.** (D2)
- `lib/auth/magic.ts`: `requestMagicLink(email, ip)` (rate limit: 3/15 phút/email, 20/giờ/IP; **luôn trả thành công** để không lộ email tồn tại), `consumeMagicToken(token)`.
- `lib/email/send.ts` (Resend) + template `lib/email/templates/magic-link.tsx` (tiếng Việt, hạn 15 phút, nút CTA, link text dự phòng).
- `app/api/auth/magic/request/route.ts` (POST). Trang `/auth/magic?token=…` hiển thị nút "Đăng nhập" → gọi `signIn('magic-link', { token })` (Credentials provider thứ 2 trong `auth.ts`).
- Khi xác thực thành công: tạo user nếu chưa có (`email_verified_at=now()`, **kèm profile** với `display_name` = phần trước `@`), nếu user tồn tại mà `email_verified_at` null → set verified **và `password_hash=null`** (cùng logic pre-hijack như Google).
- UI: màn "Chào bạn quay lại" + thông báo xanh *"Mình đã gửi link vào email. Mở link để vào app nhé ✨ (hiệu lực 15 phút)"*, nút gửi lại (cooldown 60s).
- AC: token dùng lần 2 → lỗi; hết 15 phút → lỗi; quét link bằng GET không tiêu token.

**T1.5 Restyle `/login`, `/signup`** theo spec (quote "Mỗi ngày bên nhau là một kỷ niệm đáng nhớ.", nút Google/Apple, "hoặc dùng email", dòng đồng ý Điều khoản & "Ứng dụng dành cho người từ 16 tuổi."). Sau đăng nhập lần đầu: `/onboarding`. Giữ `?next=`.

**T1.6 Onboarding.** Route group `app/(onboarding)/onboarding/page.tsx` (cần đăng nhập, chưa `onboarded_at`). Field: Tên hiển thị · Ngày sinh (hint "Dùng để kiểm tra độ tuổi, tính thần số học và cung hoàng đạo.") · Màu chủ đạo (chọn palette/hex, xem D18) · checkbox đồng ý lưu ảnh/ghi chú ở chế độ riêng tư (**bắt buộc**). Validate tuổi ≥16 ở **server** (`POST /api/profile/onboard`): <16 → không lưu `birth_date`, hiện màn chặn thân thiện + nút "Xoá tài khoản". Lưu `consent_at`, `consent_version`, `onboarded_at`, `user_preferences.primary_color`.
- `(app)/layout.tsx`: nếu `!profile.onboarded_at` → `redirect('/onboarding')`.
- AC: không thể vào `/dashboard` khi chưa onboard; sinh năm khiến <16 tuổi bị chặn.

**T1.7 Chọn hành động.** `/couple/setup` hiển thị "Bạn muốn làm gì?" với 2 lựa chọn (Tạo couple / Nhập mã mời). `CoupleGuard` điều hướng user chưa có couple tới đây.

**T1.8 Tạo couple.** `/couple/new` ("Tạo couple mới 💕": Tình trạng mối quan hệ, Ngày bắt đầu yêu; không cho ngày tương lai). `POST /api/couples` (sửa từ v1) → sau đó chuyển `/couple/invite`.

**T1.9 Invite — server.** Migration M2 + `lib/invites.ts` (`createInvite`, `revokeInvite`, `getActiveInvite`, `redeem` gọi RPC). API:
- `POST /api/invites` (tạo mới, thu hồi invite active cũ; nhận `message` ≤140) · `DELETE /api/invites/[id]` (thu hồi) · `GET /api/invites/active` · `GET /api/invites/preview?token=` (trả tên người mời, avatar, message, `expires_at`; **không** trả thông tin couple) · `POST /api/invites/redeem` (`{ token }` hoặc `{ code }`).
- Rate limit redeem: 5 lần sai/15 phút/user, 30/giờ/IP → 429 với copy "Bạn đã nhập sai nhiều lần, thử lại sau ít phút nhé."
- Token/code sinh bằng `crypto.randomBytes`, alphabet Crockford; lưu **hash**; trả plaintext đúng một lần khi tạo. Nếu người dùng reload/mất link thì hiển thị nút "Tạo link mới" (thu hồi cái cũ) — không lưu plaintext.
- AC: dùng token 2 lần → lần 2 lỗi; hết hạn → lỗi; thu hồi → lỗi; người thứ 3 → `couple_full`; race 2 request đồng thời chỉ 1 thành công (test bằng 2 promise song song).

**T1.10 Invite — UI.**
- `/couple/invite` ("Gửi lời mời cho người ấy ✨"): hiển thị `dj.app/join/<token>` (dùng `APP_URL`), nút Sao chép / Chia sẻ (Web Share API), đồng hồ đếm ngược realtime (`Hết hạn sau 47:59:12`), "Dùng một lần · Thu hồi được", khối "Không dùng được link?" với mã 6 ký tự, ô nhập tin nhắn kèm lời mời, trạng thái "Đang đợi người ấy" (poll 3s `GET /api/invites/active` hoặc Supabase realtime trên `couple_members`; khi đủ 2 người → toast + `/dashboard`).
- `/couple/join` ("Nhập mã mời": 6 ô ký tự, tự viết hoa, dán được, hiện lỗi/ khoá tạm).
- `/join/[token]` ("{Tên} mời bạn cùng ghi lại hành trình"): chưa đăng nhập → `/login?next=/join/<token>`; đã đăng nhập chưa onboard → onboarding rồi quay lại; hiển thị lời nhắn, "Lời mời hết hạn sau X giờ", "Chỉ hai bạn xem được nội dung chung", nút xác nhận tham gia.
- AC (E2E thủ công): A tạo couple → copy link → B mở link trên thiết bị khác → B xác nhận → cả hai vào `/dashboard` thấy cùng couple.

**T1.11 Tương thích user cũ.** Couple 1 thành viên: `/couple/invite` tự tạo invite khi chưa có active. Couple đủ 2 người: không đổi gì. Ghi chú trong PR: cột `couples.invite_code` ngừng dùng (drop ở P13).

### P2 — Media riêng tư, Ghi nhanh, Danh sách buổi hẹn

**T2.1 Migration M4** (`dates_v2`, `date_places`, `date_media`) + script `scripts/backfill-v2-media.mjs`. Chạy dry-run và ghi kết quả vào mô tả PR.

**T2.2 Upload API mới.** Viết lại `app/api/upload/route.ts`: input `{ file, kind: 'image'|'video'|'avatar', date_id? }`; kiểm membership; kiểm **magic bytes** (JPEG/PNG/WebP/HEIC→chuyển WebP ở client, MP4/MOV); giới hạn 20MB ảnh / 50MB video; path `${couple_id}/${date_id ?? 'drafts'}/${uuid}.${ext}`; ghi vào bucket private bằng admin client; **không** trả public URL — trả `{ path, kind, width, height, bytes }`. Avatar vẫn dùng bucket `avatars` (public) như cũ.
- Tạo `date_media` trong cùng request `POST /api/dates` (xem T2.4), không để client tự insert path tuỳ ý (client chỉ gửi mảng `path` đã upload; server kiểm path bắt đầu bằng `${couple_id}/`).

**T2.3 Media proxy.** `app/api/media/[id]/route.ts` (GET): đọc `date_media` bằng RLS client → nếu có → admin `createSignedUrl(path, 60)` → `302` với header `Cache-Control: private, max-age=300`. Query `?size=thumb` dùng `thumb_path`. Component `components/features/secure-image.tsx` (`<img src="/api/media/{id}?size=thumb">`, lazy, skeleton, fallback). Cập nhật `image-gallery.tsx` (lightbox hỗ trợ video `<video controls playsinline>`), `date-card.tsx`, trang chi tiết.
- AC: mở URL media khi chưa đăng nhập → 401; user khác couple → 404; URL signed trả về hết hạn sau ≤60s.

**T2.4 API dates v2.** `createDateSchema`: `location` không còn bắt buộc; ràng buộc "có ít nhất 1 media **hoặc** `note`" (refine). Nhận `places[]` (≤8), `media[]` (≤9, ≤1 video), `mood`, `title`, `note`, `date_time`, `end_date`, `tags[]` (≤5, mỗi tag ≤20 ký tự), `spend_vnd`, `paid_by`/`paid_split`, `song`, `client_id`. Idempotent theo `client_id` (upsert → trả bản ghi cũ nếu trùng). `PATCH /api/dates/[id]` mở rộng tương ứng, đồng bộ `dates.location_*` = place[0]. Cập nhật `types/database.ts`, `types/forms.ts`, `hooks/use-date-mutations.ts` (hiện ghi thẳng bằng supabase client → chuyển sang gọi API để đi qua validation), `lib/queries/dates.ts` (select kèm `date_places`, `date_media`).

**T2.5 Form "Buổi hẹn mới".** Viết lại `components/features/date-form.tsx` theo spec, thứ tự: 📸 Khoảnh khắc (ảnh/video; "Chụp hoặc chọn từ thư viện"; "Tối đa 9 ảnh") → 💭 Hôm nay hai bạn thấy thế nào? (chọn mood + 1 dòng `note`) → ✍️ Đặt tên (tuỳ chọn) → 📍 Địa điểm (1 hoặc nhiều, ghim lên Bản đồ kỷ niệm, autocomplete qua `/api/places/search` — xem T5.2; nhập tay vẫn được) → 🗓️ Khi nào (Ngày / Đến ngày, mặc định hôm nay hoặc `?date=` từ lịch) → Gắn thẻ → 💸 Chi tiêu (đ) → 🎵 Bài hát → Ai trả? (Tôi / Người ấy / Chia đôi) → "🔒 Chỉ hai bạn thấy". Khối "Thêm chi tiết" (thu gọn) chứa `pros/cons/wish_next_time/rating` (D5). Nút Lưu luôn hiển thị ở đáy, **mục tiêu ≤10 giây**: chỉ 1 ảnh + 1 mood + Lưu là xong.
- Upload ảnh song song (≤3 đồng thời), hiển thị tiến độ, tạo thumb 480px phía client (mở rộng `lib/image/image-compress.ts`, thêm `makeThumbnail`, `extractVideoPoster`).
- AC: ghi 1 kỷ niệm chỉ với 1 ảnh trong ≤3 thao tác chạm; validate báo lỗi tiếng Việt thân thiện.

**T2.6 Bản nháp offline.** `lib/drafts.ts` (IndexedDB, `idb-keyval` hoặc tự viết): khi mất mạng/ lỗi mạng lúc lưu → lưu nháp (form + file blob), hiện banner *"Mạng hơi yếu — Mình giữ bản nháp cho bạn, thử lại sau nhé."* Tự thử lại khi `online`; dùng `client_id` để idempotent. Danh sách nháp hiện ở đầu `/dates`.
- AC: bật chế độ máy bay → lưu → nháp xuất hiện → tắt chế độ máy bay → tự đồng bộ đúng 1 bản ghi.

**T2.7 `/dates` nâng cấp.** Tiêu đề "Buổi hẹn hò 📅", "{n} kỷ niệm đã ghi lại", ô **Tìm kỷ niệm** (debounce 300ms; tìm `title`, `note`, `date_places.name`, `tags`; dùng `ilike` + index `pg_trgm` — thêm trong M4), lọc theo mood/tag. Vẫn infinite scroll 20/trang. Cập nhật `keys.dates`.

**T2.8 "Ngày này năm ngoái".** RPC `on_this_day` + `/dates/on-this-day` (nhóm theo "1 năm trước", "2 năm trước"…), empty state thân thiện. Export hook `useOnThisDay(coupleId)` cho Home.

**T2.9 Chi tiết kỷ niệm.** `/dates/[id]`: gallery, mood chip, địa điểm (list), chi tiêu, bài hát, tag, vùng reaction/comment (placeholder, hoàn thiện P4). Gọi upsert `date_views` khi người **không phải tác giả** mở (P4).

### P3 — Home (Dashboard v2)

**T3.1 Khung Home.** `app/(app)/dashboard/page.tsx` theo thứ tự spec: banner mốc (khi ≤7 ngày — dòng "🎉 Chỉ còn vài ngày nữa là tới mốc mới!", tái dùng `MilestoneBanner`) → lời chào "Chào {tên} 💗 / Hôm nay hai bạn đã làm gì cùng nhau chưa?" → **Counter card** → Câu hỏi hôm nay (P4) → **Lịch tình yêu** → Ngày này năm ngoái → Mốc sắp tới → Kỷ niệm gần đây → Muốn thử cùng nhau (P4) → Chi tiêu tháng này (P5). Mỗi widget là component riêng, tự xử lý loading/empty/error; widget của phase sau chưa xong thì **không render** (không placeholder rỗng).

**T3.2 Counter card.** Cập nhật `components/features/couple-counter.tsx`: số ngày lớn, "ngày bên nhau", tên + biệt danh `Minh Anh (Bé Heo) & Quốc Huy (Gấu)` (biệt danh = `couple_members.nickname` của người kia, xem v1), badge trạng thái ("❤️ Chính thức" ← map `relationship_status`), khối "🎁 Mốc tiếp theo: **500 ngày** · còn N ngày" (`useCouple().nextMilestones[0]`). Bổ sung sinh nhật người ấy vào `getNextMilestones` (dựa `profiles.birth_date`, bỏ qua nếu null) và nhãn "🎂 Sinh nhật {tên}".

**T3.3 Lịch tình yêu.** Cập nhật `components/features/monthly-calendar.tsx`: mỗi ô có **số ngày yêu** (nhỏ), chấm hồng ở ngày có kỷ niệm (kể cả các ngày nằm trong `date_time..end_date` — dùng RPC `dates_by_day_range`), chạm ô có kỷ niệm → bottom sheet danh sách, chạm ô trống (≤ hôm nay) → `/dates/new?date=YYYY-MM-DD`; ô tương lai không bấm. Chú thích: "Số nhỏ là ngày yêu. Chấm hồng là ngày đã ghi. Chạm vào ô trống để ghi mới."

**T3.4 Điều hướng.** Cập nhật `components/layouts/app-sidebar.tsx` theo D16, thêm `/more` hub (`app/(app)/more/page.tsx`, lưới các mục có icon lucide). FAB ➕ → `/dates/new`. Thêm các route mới vào `proxy.ts` `APP_ROUTES`.

**T3.5 Recent & Mốc sắp tới.** Widget "Kỷ niệm gần đây" (3 mục, `SecureImage` thumb) và "Mốc sắp tới" (3 mục). Trạng thái rỗng dùng `dashboard-empty-dates.tsx` hiện có.

- AC phase: Home tải <2s trên 4G giả lập với 200 kỷ niệm; không có layout shift lớn (CLS <0.1); đủ 9 khối theo spec khi các phase sau hoàn thành.

### P4 — Tương tác: Reaction/Bình luận, Câu hỏi hằng ngày, Wishlist

**T4.1 Migration M5, M6, M7** (+ seed ≥365 câu hỏi tiếng Việt trong `supabase/seed/questions.sql`; 3 câu đầu lấy từ spec: *"Điều gì ở người ấy làm bạn thấy yên tâm nhất?"*, *"Nơi nào bạn muốn cùng đi nhất trong năm nay?"*, *"Bài hát nào làm bạn nhớ tới người ấy?"*; câu thứ 4 *"Một thói quen nhỏ của người ấy bạn thấy dễ thương?"*). Câu hỏi tích cực, không nhạy cảm, đa dạng (kỷ niệm, tương lai, sở thích, biết ơn). Tránh nội dung tình dục/tài chính nhạy cảm.

**T4.2 Reaction & bình luận.** Component `components/features/memory-reactions.tsx`: nút tim (toggle), danh sách bình luận (tối đa 500 ký tự, sửa/xoá của mình), chỉ báo "Quốc Huy đã xem" từ `date_views`. Optimistic update qua TanStack Query (`keys.dates.detail`). Phát sự kiện thông báo (P7).
- AC: A thả tim → B thấy ngay sau refetch ≤3s; B không xoá được bình luận của A.

**T4.3 Câu hỏi hằng ngày.**
- Server/RPC: `get_or_create_today_question`, `get_streak`, API `GET /api/daily` (câu hỏi hôm nay, trạng thái 2 người, câu trả lời của mình, câu trả lời của partner **chỉ khi RLS cho phép**, streak, 10 câu gần đây kèm trạng thái `both_done | missed | pending`) và `PUT /api/daily/answer`.
- UI `/daily`: "Câu hỏi hôm nay", textarea đếm `0/300`, nút Gửi; khối "Trạng thái" (Minh Anh · Chưa trả lời / Quốc Huy · Đã trả lời), dòng *"Đợi bạn trả lời xong thì câu trả lời của Quốc Huy sẽ mở ra."*; khi cả hai xong → hiệu ứng mở, hiện cả hai câu trả lời; "Những câu gần đây" (Cả hai đã xong / Hôm qua bỏ lỡ). Badge "🔥 Chuỗi 12 ngày".
- Widget Home: card câu hỏi + trạng thái "Đợi cả hai", "Bạn: chưa trả lời · Quốc Huy: đã trả lời", chuỗi.
- AC: **kiểm thử RLS bằng 2 user**: khi A chưa trả lời, truy vấn trực tiếp `daily_answers` bằng token của A không thấy hàng của B; sau khi A trả lời thì thấy. Không thể trả lời cho ngày khác hôm nay (giờ VN). Unit test `get_streak` các trường hợp: 0, 1, đứt giữa chừng, qua nửa đêm giờ VN.

**T4.4 Wishlist "Cùng nhau".** `/together`: form (Điều muốn thử · Ghi chú (tùy chọn) · Ngân sách dự kiến), hai nhóm "Chưa làm"/"Đã làm", đánh dấu xong bằng 1 chạm, sau khi đánh dấu xong gợi ý "Ghi lại buổi hẹn này?" → `/dates/new?wish=<id>` (điền sẵn tên, ngân sách; khi lưu gán `linked_date_id`). Widget Home "Muốn thử cùng nhau" (3 mục chưa làm). Hook `use-wishlist.ts`, keys `keys.wishlist`.
- AC: thêm/sửa/xoá/đánh dấu xong; cả hai thấy cập nhật.

### P5 — Chi tiêu & Bản đồ

**T5.1 Chi tiêu.** RPC `spending_stats(p_couple, p_month)` → `{ total, avg_per_date, max_item, weekly[], rows[] }` (tuần 1–5 theo tháng, giờ VN; "trung bình mỗi buổi" = tổng / số buổi có chi tiêu; "Tiêu nhiều nhất" = tên + số tiền hoặc "—"). `/spending`: bộ chọn tháng, 3 số liệu (Tổng tháng, Trung bình mỗi buổi, Tiêu nhiều nhất), biểu đồ **Theo tuần** (SVG nhẹ tự vẽ, không thêm lib nặng), bảng "Các buổi hẹn có chi tiêu" (Buổi hẹn · Ngày · Ai ghi · Số tiền), ghi chú "Chỉ nhập khi bạn muốn, không bắt buộc.", đặt ngân sách tháng (`couples.monthly_budget_vnd`, sửa inline). **Thống kê nâng cao** (mở cho tất cả, bỏ nhãn Plus): theo địa điểm, theo mood, nút "Xuất báo cáo" (CSV có BOM UTF-8 để Excel đọc đúng tiếng Việt).
- Widget Home "Chi tiêu tháng này": `0đ` + "Ngân sách tháng: 2.000.000đ" + progress; >100% đổi màu cảnh báo (không dùng màu đỏ đơn độc, kèm icon/text).
- AC: unit test RPC logic phía TS với dữ liệu mẫu; ranh giới tháng theo giờ VN đúng (kỷ niệm 00:30 ngày 1 tính vào tháng mới).

**T5.2 Places proxy.** `app/api/places/search/route.ts`: yêu cầu đăng nhập, rate limit 30 req/phút/user, cache 10 phút; provider Goong nếu có key, ngược lại Nominatim (UA + throttle). Trả `{ name, lat, lng, area_label }[]` (chuẩn hoá `area_label` = quận/huyện hoặc thành phố). Component `components/features/place-picker.tsx` (autocomplete, chọn trên bản đồ nhỏ tuỳ chọn, nhập tay).

**T5.3 Bản đồ kỷ niệm.** `/map`: Leaflet (chỉ import client, `dynamic(..., { ssr:false })`), marker theo `date_places` có toạ độ, cluster khi >50, popup (ảnh thumb, tên, ngày) → link chi tiết; khối **Hành trình nhiều điểm**: danh sách các buổi hẹn có ≥2 điểm, chọn → vẽ polyline nối theo `position` và fit bounds. Thông báo riêng tư cố định: *"Riêng tư — Địa điểm chính xác chỉ hiện với hai bạn. Thẻ chia sẻ không bao giờ in vị trí."* Tile OSM (đúng attribution). Backfill toạ độ cho `date_places` chỉ có tên: nút "Tìm vị trí" từng mục (không tự động hàng loạt để tránh vi phạm rate limit).
- AC: kỷ niệm không có toạ độ không làm vỡ trang; map hoạt động mobile (pinch/zoom); không request tile tới host ngoài CSP.

### P6 — Quyền riêng tư & Vòng đời dữ liệu

**T6.1 Khoá app.** `components/security/app-lock.tsx` + `lib/security/lock.ts` (D14). Cài đặt: bật/tắt, đặt PIN (nhập 2 lần), bật sinh trắc (kiểm `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()`; ẩn nếu không hỗ trợ). Tự khoá sau **1 phút** ở nền (`visibilitychange` lưu `hiddenAt`; khi quay lại nếu >60s → hiện lock). Màn "Nhập mã để mở app": bàn phím số, 5 lần sai → chờ 30s (tăng dần), 10 lần → đăng xuất. Mount trong `(app)/layout.tsx` bọc children, **chặn render nội dung** (không chỉ phủ lên bằng CSS) khi locked.
- AC: reload trang khi locked vẫn locked; nội dung kỷ niệm không có trong DOM khi locked.

**T6.2 Ẩn đa nhiệm.** Công tắc "Ẩn nội dung ở màn hình đa nhiệm — Làm mờ app khi chuyển ứng dụng." Overlay blur + logo khi `visibilitychange→hidden`/`pagehide`/`blur`, gỡ khi quay lại. Ghi chú giới hạn trong UI helper text ngắn gọn (không hứa tuyệt đối).

**T6.3 Cài đặt → Riêng tư & bảo mật.** `/settings/privacy` gồm Khóa app, Ẩn đa nhiệm, bảng "Ai xem được gì" (copy nguyên bảng 4 dòng của spec), dòng "Ảnh chỉ mở qua đường dẫn có hạn. Người ngoài không xem được dù có link." — **sự thật phải khớp T2.3**.

**T6.4 Xuất dữ liệu ZIP.** `app/api/export/route.ts` (POST → stream ZIP bằng `fflate`, `export const maxDuration = 300`): `data.json` (profile, couple, dates + places + media metadata, comments, reactions, wishlist, câu trả lời của mình + của partner nếu đã mở, quiz, capsules đã mở, `ai_readings` của mình, chat), `photos/<date_id>/<n>.<ext>` (tải tuần tự qua signed URL nội bộ), `README.txt`. Chỉ xuất dữ liệu user có quyền xem. UI ở `/settings/data`: "Xuất dữ liệu — File ZIP gồm JSON và ảnh gốc." với trạng thái đang chuẩn bị. Rate limit 3/giờ. Nếu dữ liệu >~500MB: hiển thị hướng dẫn thử lại hoặc (stretch) chuyển sang job `export_jobs` + push khi xong.
- AC: giải nén ZIP mở được JSON hợp lệ và ảnh; user ngoài couple không export được dữ liệu couple.

**T6.5 Rời couple.** `POST /api/couples/leave`: bước 1 (UI modal 1: giải thích + nút "Xuất dữ liệu trước" + "Tiếp tục"), bước 2 (modal 2: gõ chữ **RỜI** hoặc giữ nút 2 giây) → server đặt `couple_members.left_at`, `couples.dissolved_at=now()`, `purge_after=now()+30d`. Cả hai người chuyển chế độ **chỉ xem & xuất** (UI hiện banner "Dữ liệu chung sẽ được lưu 30 ngày rồi xoá. Bạn có thể xuất trước."; mọi mutation bị chặn bằng RLS: thêm điều kiện `couples.dissolved_at is null` vào policy insert/update/delete các bảng couple-scoped).
- **Cron** `purge_dissolved_couples()` hàng ngày: xoá storage objects theo prefix `${couple_id}/` rồi xoá couple (cascade). 
- AC: sau khi rời, ghi mới bị từ chối ở DB; sau `purge_after` dữ liệu và file biến mất.

**T6.6 Xoá tài khoản.** `DELETE /api/account` (yêu cầu nhập lại xác nhận): xoá avatar, `ai_readings`, `daily_answers`, `love_quiz_results`, `push_subscriptions`, `notification_*`, `auth_accounts`, `auth_users` (cascade `profiles`), áp D8 cho dữ liệu chung. Đăng xuất & xoá cookie. Khớp copy: "Xóa toàn bộ dữ liệu cá nhân, gồm ảnh và kết quả AI."
- AC: audit SQL: không còn dòng nào chứa `profile_id` của user (trừ `created_by` đã `set null`).

### P7 — Thông báo đẩy

**T7.1 Hạ tầng.** Migration M8; `public/sw.js` (xử lý `push`, `notificationclick` mở đúng route); `lib/push/send.ts` (`web-push`, xoá subscription trả 404/410); `POST /api/push/subscribe|unsubscribe`; hook `use-push.ts`. Đăng ký service worker trong `components/providers/pwa-provider.tsx`.

**T7.2 UI `/settings/notifications`** (copy nguyên văn spec): "Bật thông báo trên thiết bị này — Thêm Dating Journal vào màn hình chính để nhận thông báo đẩy." (iOS chưa standalone → hướng dẫn 2 bước ngắn), các công tắc: Người ấy thả tim hoặc bình luận · Nhắc ghi buổi hẹn cuối tuần (Chủ nhật 20:00) · Câu hỏi hằng ngày (21:00) · Mốc ngày yêu và sinh nhật (nhắc trước 7 ngày) · Ngày này năm ngoái (sáng mỗi ngày có kỷ niệm) · Giờ yên lặng (từ… đến…). Lưu `notification_prefs` ngay khi gạt (optimistic).

**T7.3 Gửi sự kiện.** Reaction/comment: gửi ngay cho partner (tôn trọng giờ yên lặng → bỏ qua, không dồn). Cron `GET /api/cron/notify` (`Authorization: Bearer ${CRON_SECRET}`) chạy mỗi 15 phút: tính theo giờ VN → weekend (CN 20:00), daily question (21:00, nếu chưa trả lời), milestone/birthday (trước 7 ngày + đúng ngày), on-this-day (08:00), capsule mở khoá (P11). Dedupe bằng `notification_log (profile_id, kind, ref)`.
- Nội dung push ngắn, thân thiện, **không** lộ nội dung riêng tư (ví dụ "Quốc Huy vừa thả tim một kỷ niệm 💗", không kèm nội dung bình luận), và **không** nhắc Plus/giá.
- AC: bật/tắt từng loại hoạt động; trong giờ yên lặng không có push; không gửi trùng.

### P9 — Cupid & Khám phá

*(P9 làm sau P7; P8 đã bỏ.)*

**T9.1 Cupid.** `app/api/ai/chat/route.ts`: trước khi gọi Gemini → `consume_quota('cupid', 200/ngày/user)`; AI lỗi → `refund_quota`. Nội dung system prompt (`lib/ai/prompts/chat.ts`) bổ sung: ngân sách tháng + chi tiêu tháng này, wishlist chưa làm (≤10), mood gần đây, **disclaimer** (không đưa lời khuyên y tế/pháp lý), quy tắc an toàn (nếu người dùng nói về tự hại/bạo hành → phản hồi đồng cảm, khuyến khích tìm người tin cậy/đường dây hỗ trợ, không đóng vai chuyên gia). Giới hạn đầu vào 2000 ký tự (đã có). UI `/chat`: tiêu đề "Cupid 💘", mô tả "Gợi ý buổi hẹn theo ngân sách và wishlist của hai bạn.", ô "Nhắn cho Cupid", dòng nhỏ *"Cupid gợi ý để tham khảo và không đưa ra lời khuyên y tế hay pháp lý. Cuộc trò chuyện chỉ hai bạn xem được."* **Không** hiện "7 trên 10", **không** hiện card "Muốn không giới hạn?". Chạm trần → toast *"Hôm nay Cupid đã trò chuyện khá nhiều rồi, mai gặp lại nhé 💘"*. Gợi ý nhanh (chips) dựa trên wishlist/ngân sách.
- AC: user không thấy bất kỳ từ "Plus/gói/nâng cấp" nào ở `/chat`; vượt trần trả 429 đúng copy.

**T9.2 Khám phá.** `app/api/ai/reading/route.ts`: giữ cache 24h (không trừ lượt khi trúng cache), còn lại `consume_quota('reading', 30/ngày/user)`. Thêm `shared_with_partner` (migration riêng `20261101000900_readings_share.sql`: cột + policy SELECT cho partner khi cờ bật; **bỏ phần này khỏi M9**): công tắc **"Chia sẻ kết quả cho người ấy — Mặc định chỉ mình bạn thấy."** trên `reading-card.tsx`; `PATCH /api/ai/reading/[id]` đổi cờ. Màn "Khám phá tình yêu ✨" có dòng *"Cho vui thôi nha, đừng xem là lời tiên tri 🔮"*. **Bỏ** "Còn 1 lượt hôm nay". Mục "Lịch sử luận giải" liệt kê của mình + của partner đã chia sẻ (gắn nhãn người chia sẻ). Ảnh chỉ tay: **không lưu ảnh** (đã đúng ở v1; giữ), nén ≤1024px client, ghi chú ngắn "Ảnh chỉ dùng để luận giải, không được lưu."
- Chuẩn hoá lại `insights/page.tsx` (457 dòng): tách `NumerologyTab`, `ZodiacTab`, `TarotTab`, `PalmTab` ra `components/features/insights/*` **chỉ khi** cần sửa; không viết lại toàn bộ.

### P10 — Wrapped & Thẻ chia sẻ

**T10.1 Dữ liệu & sanitize.** RPC `get_wrapped(p_couple, p_period)` (`month:YYYY-MM` | `year:YYYY`, giờ VN) → số buổi hẹn, số địa điểm khác nhau, mood nhiều nhất, số ảnh, chuỗi câu hỏi dài nhất, số ngày bên nhau, mốc đạt được, (tuỳ chọn người dùng bật) tổng chi tiêu. `lib/wrapped/sanitize.ts`: hàm **whitelist** `toShareable(data)` chỉ cho qua: tên hiển thị (hoặc viết tắt), số liệu tổng hợp, `area_label` (quận/thành phố — **không** tên quán, **không** toạ độ), ảnh do người dùng **chủ động chọn**. Tuyệt đối không đi qua `note/pros/cons/wish/comment/song/title`. Unit test: truyền object chứa mọi field nhạy cảm → output không chứa chúng (snapshot).

**T10.2 Render thẻ.** `app/api/wrapped/card/route.ts` dùng `ImageResponse` (`next/og`), **1080×1920**, tham số `period`, `index`, `template`, `watermark` (bool), `hideNotes` (bool). Font Be Vietnam Pro **TTF** đặt trong `assets/fonts/` (satori không đọc woff2; không tải từ mạng). Mã QR (`qrcode`) trỏ `APP_URL/?ref=wrapped`. Cache `private, max-age=3600`. Yêu cầu đăng nhập + membership. Thẻ **không bao giờ** in vị trí chính xác (T10.1).

**T10.3 `/wrapped`.** "Wrapped — Tổng kết của hai bạn": carousel 4 thẻ ("1 trên 4"), bộ chọn tháng/năm (mọi người dùng được, kể cả bản năm), nút "Tạo thẻ để khoe" ("Thẻ dọc 1080×1920 cho story. Địa điểm chính xác và ghi chú riêng được ẩn."). Bỏ mọi khối "Bản Plus". Năm hiện tại mở từ 01/12; các năm trước luôn mở.

**T10.4 `/wrapped/share`.** "Thẻ chia sẻ — Xem trước trước khi đăng ra ngoài.": preview thẻ (VD "414 ngày bên nhau — Minh Anh & Quốc Huy"), chọn **Mẫu thẻ** (≥6 mẫu, thuần CSS/SVG, đều miễn phí), 3 công tắc: **Ẩn địa điểm chính xác** (luôn bật, disabled, helper "Luôn bật cho thẻ chia sẻ ra ngoài."), **Ẩn ghi chú riêng** (mặc định bật), **Watermark và mã QR** (mặc định bật; **tắt được tự do**, helper chỉ nói "Hiện dòng 'Tạo bằng Dating Journal' và mã QR."). Nút Chia sẻ (`navigator.share({ files })`, fallback tải PNG). Thẻ mốc 100 ngày: từ `MilestoneCelebration` có nút "Tạo thẻ mốc" (template `milestone`).

**T10.5 (có thể sau launch) PDF "Cuốn sách kỷ niệm".** `/settings/data` → "Xuất PDF cuốn sách kỷ niệm": job nền (cần Be Vietnam Pro TTF nhúng), mỗi kỷ niệm 1 trang (ảnh, tên, ngày, mood, địa điểm chung chung, ghi chú nếu người dùng chọn). Giới hạn 200 kỷ niệm/lần; trả signed URL hạn 24h + push khi xong.

### P11 — Time capsule & Quiz ngôn ngữ tình yêu

**T11.1 Time capsule.** Migration M9 (không có phần ai_readings) + RPC `list_capsules`, `open_capsule(p_id)` (đặt `opened_at` lần đầu, trả nội dung nếu `unlock_on <= hôm_nay_VN`), `delete_capsule(p_id)` (chỉ tác giả, chỉ khi **chưa** mở khoá). API tạo: `POST /api/capsules` (title ≤80, body ≤5000, tối đa 3 ảnh, `unlock_on` ≥ ngày mai, ≤10 năm). Ảnh upload vào `${couple_id}/capsules/${id}/…`; **không có** đường media proxy nào trả ảnh capsule trước ngày mở (T2.3 kiểm bảng nguồn; tạo `app/api/capsules/media/[id]/route.ts` riêng gọi `open_capsule`).
- UI `/capsules`: "Time capsule — Viết thư hoặc cất ảnh, khóa đến ngày hai bạn hẹn."; danh sách thẻ ("Lời hứa 1 năm — Mở ngày 20/08/2026 · Minh Anh viết — Đã mở" / "🔒 Đã khóa"); form "Viết thư mới" (Tiêu đề · Nội dung · Mở vào ngày). Đã khoá: chỉ thấy tiêu đề, người viết, ngày mở (**kể cả tác giả không đọc lại được nội dung**) — nói rõ trước khi lưu: "Sau khi khoá, cả hai sẽ không đọc được cho tới ngày mở."
- Ngày mở: push "Có một time capsule vừa mở 💌" (P7 cron).
- AC: gọi trực tiếp bảng bằng token user → không có quyền SELECT; RPC trước ngày mở trả `body=null`; sau 00:00 giờ VN của `unlock_on` mới trả nội dung; test với đồng hồ giả (unit trên hàm TS kiểm ngày) và SQL thủ công.

**T11.2 Quiz.** `lib/quiz/love-languages.ts`: 15 câu chọn 1 trong 2 phát biểu, mỗi lựa chọn gắn 1 trong 5 ngôn ngữ (lời nói · thời gian chất lượng · quà tặng · hành động giúp đỡ · chạm); mỗi ngôn ngữ xuất hiện đúng 6 lần trên tổng 30 lựa chọn. Chấm điểm thuần hàm + unit test. `/quiz`: "Quiz ngôn ngữ tình yêu — Mỗi người làm riêng, kết quả so sánh khi cả hai xong." Lưu `love_quiz_results` (RLS mở cho đối phương chỉ sau khi mình xong). Màn so sánh: 2 cột điểm, ngôn ngữ chính mỗi người, mức hợp, 3 gợi ý tĩnh theo cặp (viết sẵn nội dung, không gọi AI). Làm lại được; kết quả mới ghi đè.

### P12 — Cài đặt, Giao diện, Trợ năng, i18n

**T12.1 Cài đặt chia mục.** Thay `settings-dashboard.tsx` (2 tab) bằng trang chỉ mục `/settings` ("Cài đặt ⚙️ — Quản lý tài khoản và tùy chỉnh ứng dụng") + route con: **Hồ sơ** (Tên hiển thị, Ngày sinh), **Couple & biệt danh** (tên cặp, "Bắt đầu yêu 20/08/2025", biệt danh bạn đặt cho người ấy / người ấy đặt cho bạn — dùng lại `couple_members.nickname` & `nickname-form.tsx`, tình trạng quan hệ), **Giao diện**, **Quyền riêng tư và bảo mật** (T6.3), **Thông báo** (T7.2), **Dữ liệu của bạn** (Xuất dữ liệu, PDF nếu có), **Vùng cần cân nhắc** (Rời couple — "Dữ liệu chung lưu 30 ngày rồi xóa, bạn có thể xuất trước."; Xóa tài khoản), nút Đăng xuất. **Không có** mục "Gói của bạn".

**T12.2 Giao diện.** `/settings/appearance` ("Mọi thay đổi được lưu tự động ✨"): Chế độ hiển thị (Sáng/Tối/Tự động), Màu chủ đạo (8 palette + hex tuỳ ý), Font chữ (Be Vietnam Pro mặc định + các pair còn lại), Ngôn ngữ (vi/en). **Bỏ** "Bộ theme và sticker độc quyền". Helper: "Mọi màu đều được chỉnh để chữ đạt tương phản tối thiểu 4.5:1."

**T12.3 Tương phản 4.5:1 (sửa S6).** `lib/theme/contrast.ts`: `contrastRatio(a,b)`, `ensureAccessible(hex, bg)` → tìm biến thể đậm hơn/nhạt hơn cùng hue (điều chỉnh L trong HSL/OKLCH) cho tới khi (a) chữ trên nền nút (`primary`/`primaryFg`) ≥4.5, (b) màu chủ đạo dùng làm **chữ/icon trên nền** (`--color-bg`, `--color-surface`, cả sáng/tối) ≥4.5. Thêm token `--color-primary-strong` (dùng cho nút/ chữ) tách khỏi `--color-primary` (dùng cho nền/viền trang trí). Áp dụng trong `theme-provider.tsx` khi set CSS vars; cập nhật 8 palette (số đo hiện tại ở mục S6). Unit test lặp qua mọi palette × {light,dark} và 20 hex ngẫu nhiên: mọi cặp ≥4.5. Kiểm tay với axe/Storybook a11y addon (đã cài `@storybook/addon-a11y`).

**T12.4 Trợ năng chung.** Focus ring rõ ràng; `aria-label` cho icon-button; `prefers-reduced-motion` tắt confetti/animation ở `MilestoneCelebration`; vùng chạm ≥44px; nhãn form đúng; `viewport` hiện `maximumScale:1, userScalable:false` (app/layout.tsx) → **bỏ** để người dùng zoom được (trợ năng).

**T12.5 i18n.** Chuyển toàn bộ chuỗi mới vào `lib/i18n/translations.ts` (vi chuẩn, en nháp). Chuỗi hard-code tiếng Việt còn lại trong code cũ (VD `dashboard/page.tsx`, `chat/page.tsx`, API errors) chuyển dần khi chạm tới file đó — không bắt buộc refactor hàng loạt.

### P13 — Hoàn thiện, QA, Rollout

**T13.1 CONTRACT migration** (`…_v2_contract.sql`, **chỉ chạy sau khi P1–P12 đã lên production ≥7 ngày ổn định**): drop `couples.invite_code`, `dates.checkin_image_url(s)`, bảng `nicknames` (dư), policy/function cũ không dùng. Cập nhật `types/database.ts`.

**T13.2 Quét chuỗi cấm (bắt buộc).** Chạy:
```bash
grep -rniE "plus|premium|nâng cấp|gói |39\.000|19\.500|momo|zalopay|vnpay|👑" app components lib supabase public --include=*.ts --include=*.tsx --include=*.sql --include=*.md -l
```
Mọi kết quả phải là false-positive (VD từ `surplus`, thư viện) hoặc xoá. Kiểm cả template email, push, system prompt AI, metadata, manifest, README.

**T13.3 Bộ test.** Unit: `time`, milestone, streak, spend stats, quota, sanitize share, invite token/hash, contrast, quiz scoring, capsule-date. Integration (có thể chạy bằng Supabase local + 2 user): RLS cho `dates`, `daily_answers`, `love_quiz_results`, `time_capsules`, `couple_invites` (redeem race), IDOR S1. E2E thủ công (checklist bên dưới).

**T13.4 Hiệu năng & PWA.** Lighthouse PWA/Performance mobile; bundle: Leaflet và thư viện nặng chỉ nạp ở route tương ứng; ảnh dùng thumb; kiểm không còn request tới Google Fonts khi dùng font mặc định.

**T13.5 Rollout.** (1) Deploy migration M1–M9 (expand) → (2) chạy `backfill-v2-media.mjs` → (3) deploy code → (4) bật cron (`notify`, `purge`) → (5) theo dõi lỗi 48h → (6) T13.1 sau ≥7 ngày. Có kế hoạch rollback: mọi migration expand là cộng thêm nên code cũ vẫn chạy; riêng việc đổi bucket sang private thì **code cũ sẽ hỏng ảnh** → deploy code (T2.3) và đổi bucket **cùng một cửa sổ bảo trì ngắn**.

---

## 6. E2E checklist (chạy tay trước khi release)

1. Landing: không có chữ Plus/giá; CTA hoạt động; 16–25 tuổi hiển thị đúng.
2. Đăng ký bằng Google, Apple, magic link, email+mật khẩu; <16 tuổi bị chặn; thiếu đồng ý → không qua.
3. A tạo couple → link mời → B (thiết bị khác) tham gia; link dùng lại bị từ chối; nhập mã sai 6 lần bị khoá tạm; thu hồi hoạt động.
4. Ghi nhanh 1 ảnh + mood trong ≤10 giây; offline → nháp → tự đồng bộ không trùng.
5. Ảnh: mở URL `/api/media/..` khi đăng xuất → 401; user couple khác → 404; URL signed hết hạn.
6. Reaction/comment hai chiều; "đã xem".
7. Câu hỏi hằng ngày: A trả lời, B chưa → A không thấy câu trả lời của B; B trả lời → cả hai thấy; chuỗi tăng; qua nửa đêm giờ VN đúng.
8. Wishlist → đánh dấu xong → ghi buổi hẹn liên kết.
9. Chi tiêu: tổng/trung bình/lớn nhất/tuần đúng; ngân sách >100% cảnh báo; xuất CSV mở đúng tiếng Việt trong Excel.
10. Bản đồ: nhiều điểm vẽ đường; riêng tư; mobile.
11. Khoá app: PIN, sinh trắc, tự khoá 1 phút, ẩn đa nhiệm; nội dung không có trong DOM khi khoá.
12. Push: bật thiết bị, từng loại, giờ yên lặng, không trùng.
13. Cupid & Khám phá: hoạt động, chia sẻ kết quả, chạm trần có thông báo trung tính; không thấy chữ Plus.
14. Wrapped tháng/năm, thẻ 1080×1920 không chứa vị trí/ghi chú; tắt watermark được; chia sẻ file hoạt động trên mobile.
15. Time capsule: khoá thật sự phía server; mở đúng ngày; thông báo.
16. Quiz: kết quả đối phương chỉ hiện sau khi mình xong.
17. Xuất ZIP; rời couple 2 bước + 30 ngày; xoá tài khoản; kiểm DB sạch.
18. Font: Be Vietnam Pro mặc định mọi màn; đổi font khác vẫn được.
19. Tương phản ≥4.5:1 ở cả 8 palette + màu tuỳ ý, sáng/tối.
20. `grep` chuỗi cấm (T13.2) sạch.

---

## 7. Định nghĩa "Hoàn thành" (Definition of Done) cho mỗi task

- Code + migration + test theo AC; `lint`, `tsc`, `build` xanh; không `console.log` dữ liệu riêng tư.
- Chuỗi UI nằm trong `translations.ts`, copy khớp spec (đã loại phần Plus).
- RLS bật cho mọi bảng mới và **đã test bằng 2 user thật** (không chỉ đọc policy).
- Component UI mới có story; trợ năng (aria, focus, ≥44px, tương phản).
- PR mô tả: thay đổi gì, migration nào, cách kiểm, ảnh chụp màn hình mobile + desktop, rủi ro/rollback.

## 8. Rủi ro & điểm 🛑 cần người quyết (không chặn tiến độ — dùng mặc định)

| # | Nội dung | Mặc định đang dùng |
|---|---|---|
| 🛑1 | Nội dung pháp lý `/privacy`, `/terms` cần luật sư duyệt | bản nháp |
| 🛑2 | Tài khoản Apple Developer + key `.p8` | chưa có thì ẩn nút Apple bằng env `NEXT_PUBLIC_APPLE_ENABLED` |
| 🛑3 | Nhà cung cấp email (Resend) + domain gửi | Resend |
| 🛑4 | Nguồn geocode (Goong có phí/giới hạn) | Nominatim fallback |
| 🛑5 | Cron production (Vercel plan / Supabase pg_cron) | endpoint + `CRON_SECRET`, chọn scheduler khi deploy |
| 🛑6 | Chính sách xoá dữ liệu khi một bên rời (D7) | như D7 |
| 🛑7 | Giới hạn chống lạm dụng AI (200/30 mỗi ngày) | như D10, chỉnh ở `lib/limits.ts` |
| ⚠️ | Số mẫu trong spec (414 ngày / còn 86) không khớp công thức v1 | giữ công thức v1 (D17) |
| ⚠️ | Đổi bucket ảnh sang private làm hỏng ảnh ở bản code cũ | deploy cùng cửa sổ (T13.5) |
| ⚠️ | Khoá app & ẩn đa nhiệm là khoá giao diện/best-effort | ghi rõ ở D14, D15 |
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-10-08T18:31:49+07:00.
</ADDITIONAL_METADATA>