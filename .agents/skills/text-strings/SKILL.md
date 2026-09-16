# Skill: Quy tắc Text & String

---

name: text-strings
description: Quy tắc xử lý text, string literal, đa ngôn ngữ, thông báo lỗi, và copy trong Dating Journal App.

---

---

## 1. Ngôn ngữ hiển thị trong app

- **Giao diện**: Tiếng Việt
- **Code, comment, commit**: Tiếng Anh
- **Thông báo lỗi từ Supabase/API**: Dịch sang tiếng Việt trước khi hiển thị cho user

```typescript
// ❌ Sai: Hiển thị lỗi gốc tiếng Anh
setError(error.message); // "Invalid login credentials"

// ✅ Đúng: Map sang tiếng Việt
const ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Email hoặc mật khẩu không đúng",
  "Email not confirmed": "Vui lòng xác nhận email trước khi đăng nhập",
  "User already registered": "Email này đã được đăng ký",
};
setError(ERROR_MESSAGES[error.message] ?? "Đã có lỗi xảy ra, vui lòng thử lại");
```

---

## 2. Vị trí khai báo String

```typescript
// ✅ Strings dùng 1 lần: khai báo trực tiếp trong component
<h1>Chào mừng trở lại!</h1>

// ✅ Strings dùng nhiều nơi hoặc cần thay đổi: tách ra hằng số/object
// lib/constants/messages.ts
export const MESSAGES = {
  auth: {
    loginSuccess: 'Đăng nhập thành công',
    logoutSuccess: 'Đã đăng xuất',
    sessionExpired: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
  },
  date: {
    saveSuccess: 'Đã lưu buổi hẹn thành công ❤️',
    deleteConfirm: 'Bạn có chắc muốn xóa buổi hẹn này không?',
    deleteSuccess: 'Đã xóa buổi hẹn',
  },
  errors: {
    generic: 'Đã có lỗi xảy ra, vui lòng thử lại',
    network: 'Không thể kết nối, hãy kiểm tra internet',
    unauthorized: 'Bạn không có quyền thực hiện thao tác này',
  },
} as const;
```

---

## 3. Format String

```typescript
// ✅ Template literals cho string có biến
const greeting = `Chào ${user.display_name}!`;
const message = `Bạn đã yêu nhau được ${days} ngày`;

// ✅ Dùng Intl API để format số, ngày, tiền tệ
const formatDate = (date: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
// → "12/09/2025"

const formatDateFull = (date: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
// → "Thứ Sáu, 12 tháng 9, 2025"

// ✅ Format số ngày yêu
const formatDaysCount = (days: number) => {
  if (days === 0) return "Hôm nay";
  if (days === 1) return "1 ngày";
  return `${days.toLocaleString("vi-VN")} ngày`;
};
```

---

## 4. Validation Messages (Zod)

```typescript
// Viết message validation bằng tiếng Việt, rõ ràng
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email")
    .email("Email không đúng định dạng"),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

const dateSchema = z.object({
  location_name: z
    .string()
    .min(1, "Vui lòng nhập địa điểm")
    .max(100, "Địa điểm không được quá 100 ký tự"),
  rating: z
    .number()
    .min(1, "Vui lòng chọn điểm đánh giá")
    .max(5, "Điểm đánh giá tối đa là 5"),
});
```

---

## 5. Placeholder Text

```typescript
// Placeholder phải gợi ý rõ ràng, không chỉ nói "Nhập..."
// ✅ Tốt
placeholder = "annie@gmail.com";
placeholder = "Quán cafe Miền đồng thảo";
placeholder = "Buổi tối hôm nay thật tuyệt, mình đã...";
placeholder = "Lần sau muốn thử món...";

// ❌ Tránh
placeholder = "Nhập tên";
placeholder = "...";
placeholder = "Text here";
```

---

## 6. Empty State & Loading Text

```typescript
// Các chuỗi trạng thái rỗng phải đủ ngữ cảnh
export const EMPTY_STATE_TEXT = {
  dates: {
    title: "Chưa có buổi hẹn nào",
    description:
      "Câu chuyện tình yêu của bạn đang chờ được ghi lại.\nHãy thêm buổi hẹn đầu tiên!",
    action: "+ Thêm buổi hẹn đầu tiên",
  },
  couple: {
    title: "Chưa kết nối với người yêu",
    description:
      "Mời người yêu của bạn tham gia bằng mã kết nối\nđể cùng nhau ghi lại kỷ niệm.",
    action: "Tạo mã mời",
  },
} as const;

// Loading state
const LOADING_TEXT = "Đang tải...";
const SAVING_TEXT = "Đang lưu...";
const DELETING_TEXT = "Đang xóa...";
const UPLOADING_TEXT = "Đang tải ảnh lên...";
```

---

## 7. Không hardcode string quan trọng inline

```typescript
// ❌ Sai: magic string nằm rải rác nhiều nơi
if (status === 'talking') { ... }
if (type === 'numerology') { ... }

// ✅ Đúng: dùng constant hoặc type
const RELATIONSHIP_STATUS = ['talking', 'dating', 'official', 'engaged', 'married'] as const;
type RelationshipStatus = typeof RELATIONSHIP_STATUS[number];

const AI_READING_TYPES = ['numerology', 'zodiac', 'tarot'] as const;
type AiReadingType = typeof AI_READING_TYPES[number];
```
