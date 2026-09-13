---
name: supabase-migrations
description: Hướng dẫn tạo và chạy Supabase Migrations TỰ ĐỘNG (Agent-driven) bằng Node.js và Postgres
---

# Supabase Migrations trong Dating Journal App

Dự án này sử dụng một quy trình đặc biệt để Agent có thể tự động 100% việc cập nhật Database, không bắt USER phải chạy CLI (`npx supabase db push`) hay copy SQL bằng tay, vì hệ thống CLI cục bộ của họ không hoạt động.

Khi bạn (Agent) cần thay đổi database (thêm bảng mới, thêm RLS policy, cập nhật cột...), hãy làm theo quy trình tự động sau:

## 1. Tạo file Migration

Tất cả các file migration được đặt trong thư mục: `supabase/migrations/`

1. **Lấy timestamp hiện tại**:
   Chạy lệnh `date +%Y%m%d%H%M%S` để lấy chuỗi 14 số (vd: `20260914103000`).

2. **Tạo file SQL**:
   Dùng tool `write_to_file` để tạo file mới: `supabase/migrations/<TIMESTAMP>_<mô-tả-ngắn>.sql` (ví dụ: `20260914103000_add_user_settings.sql`).

3. **Quy tắc SQL quan trọng**:
   - Khi tạo `TABLE` mới, **PHẢI** đi kèm `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
   - **PHẢI** tạo các `CREATE POLICY` cho bảng, ví dụ: kiểm tra `couple_id IN (SELECT couple_id FROM couple_members WHERE profile_id = auth.uid())`.

## 2. CHẠY (PUSH) MIGRATION TỰ ĐỘNG 100%

Vì Supabase CLI không kết nối được trên môi trường của user, Agent **BẮT BUỘC** phải tự chạy file SQL bằng cách dùng `node` và package `pg` (cài tạm thời), đọc chuỗi kết nối từ biến `DATABASE_URL` trong file `.env.local`.

Hãy chạy chính xác lệnh sau bằng tool `run_command` (có thể bật `BypassSandbox: true` nếu mạng bị chặn):

```bash
# 1. Đọc DATABASE_URL từ .env.local
DB_URL=$(grep DATABASE_URL .env.local | cut -d '"' -f 2)

# 2. Cài pg tạm thời và chạy script
npm install pg --no-save && node -e "
const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({ connectionString: '$DB_URL' });
  try {
    await client.connect();
    const sql = fs.readFileSync('supabase/migrations/<TÊN_FILE_MIGRATION_BẠN_VỪA_TẠO>.sql', 'utf8');
    await client.query(sql);
    console.log('✅ Migration chạy thành công 100% tự động!');
  } catch (err) {
    console.error('Lỗi DB:', err);
  } finally {
    await client.end();
  }
}
run();
"
```

*(Nhớ thay `<TÊN_FILE_MIGRATION_BẠN_VỪA_TẠO>.sql` bằng tên file thật của bạn).*

## 3. Hoàn thành

Sau khi script in ra `✅ Migration chạy thành công 100% tự động!`, bạn hãy tự tin báo cáo với USER là Database đã được cập nhật thành công, họ không cần phải làm thêm thao tác nào cả.
