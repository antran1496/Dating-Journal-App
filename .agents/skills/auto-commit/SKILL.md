---
name: auto-commit
description: Kích hoạt khi user yêu cầu "lưu code", "đẩy code", "push git", "auto commit", hoặc dùng "/commit". Skill giúp tự động kiểm tra code (AI Review), tạo commit message (chuẩn emoji + conventional) và push lên Github.
---

# Git Push (Auto-Commit & Push)

Skill này tự động hóa quy trình commit và push code bằng Git, tuân thủ chặt chẽ luồng làm việc của dự án.

## Trình tự thực hiện (AI phải làm tuần tự):

### 1. Kiểm tra Branch và Tình trạng Git
- Chạy lệnh: `git branch --show-current` để lấy tên nhánh hiện tại.
- Lấy ticket ID nếu có: Nếu nhánh có dạng `tên/feat/DJA_1000` -> ID là `DJA_1000`. Nếu nhánh là `main` thì không có ID.

### 2. Thêm file vào Staging (Loại trừ Config nếu cần)
- Chạy lệnh: `git add .`
- *(Tuỳ chọn)* Nếu dự án có thư mục/file config đặc thù không muốn đẩy lên, chạy `git reset <đường_dẫn>`.
- Chạy lệnh: `git status` để xem lại các file đã được đưa vào staging. Nếu không có file nào (`nothing to commit`), báo cáo cho user và DỪNG LẠI.

### 3. Review Code Quality (Pre-commit Analysis)
- Chạy lệnh: `git diff --cached`
- **AI Tự Động Đánh Giá Diff:** Đọc kỹ nội dung code thay đổi và kiểm tra:
  - **Code Quality:** Xem có quên xoá `console.log`, code nháp bị comment lại, hoặc các dòng `TODO` chưa làm không.
  - **TypeScript:** Xem có dùng `any` bừa bãi, thiếu type, hoặc nguy cơ lỗi null/undefined không.
  - **Lỗi ngớ ngẩn:** Import dư thừa, logic dễ gây bug.
- **Quyết định (AI xử lý):**
  - 🚨 **Nghiêm trọng (Critical):** Lỗi vỡ logic, lộ secret key/password -> **DỪNG LẠI**, huỷ commit (`git reset`) và báo lỗi cho user.
  - ⚠️ **Cảnh báo nhỏ (Minor):** Code hơi lộn xộn, có console.log -> **CẢNH BÁO** user, nhưng nếu user từng cho phép bỏ qua thì vẫn đi tiếp.
  - ✅ **Sạch sẽ (Clean):** Đi tiếp sang bước 4.

### 4. Tạo Commit Message Tự Động
- Format bắt buộc: `<emoji> [<prefix>] <message>`
- **Quy tắc Prefix:**
  - **Nếu nhánh có ID (VD: `DJA_1000`):** `<emoji> [DJA_1000] feat(auth): add login form`
  - **Nếu nhánh không có ID (VD: `main`):** `<emoji> feat(auth): add login form`
- **Quy tắc Message & Emoji:** Dùng chuẩn Conventional Commits.
  - ✨ (sparkles) - `feat:` (Tính năng mới)
  - 🐛 (bug) - `fix:` (Sửa lỗi)
  - ♻️ (recycle) - `refactor:` (Tối ưu code)
  - 💄 (lipstick) - `style:` (Chỉnh sửa UI/CSS)
  - 📝 (memo) - `docs:` (Cập nhật tài liệu)
  - 🔧 (wrench) - `chore:` (Cấu hình, dependencies)

### 5. Thực hiện Commit
- Chạy lệnh: `git commit -m "MESSAGE_ĐÃ_TẠO"`
- *Lưu ý: Không dùng dấu nháy đơn (`'`) bao quanh tin nhắn nếu có chứa các ký tự đặc biệt, ưu tiên dùng dấu ngoặc kép (`"`) cho Bash.*

### 6. Push (Mặc định)
- Nếu user chỉ yêu cầu "commit", có thể dừng ở bước 5. Nếu yêu cầu "đẩy code", "push git" -> Chạy `git push origin <tên_nhánh>`.
- **Quan trọng:** Phải chạy lệnh push ở chế độ **Bypass Sandbox (BypassSandbox: true)** để đảm bảo có kết nối mạng tới Github.
- Báo cáo kết quả thành công cho người dùng kèm theo nội dung của Commit Message.
