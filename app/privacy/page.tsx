import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { LandingNav, LandingFooter } from '@/components/landing';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Chính sách quyền riêng tư — Dating Journal',
  description: 'Cam kết bảo mật dữ liệu, vòng đời lưu trữ 30 ngày, quyền xuất ZIP và xoá dữ liệu của Dating Journal.',
};

export default async function PrivacyPage() {
  const session = await auth();
  const isAuthed = !!session?.user?.id;

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-body antialiased">
      <LandingNav isAuthed={isAuthed} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại trang chủ
        </Link>

        <header className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5" />
            Minh bạch &amp; Riêng tư
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
            Chính sách quyền riêng tư
          </h1>
          <p className="mt-3 text-sm sm:text-base text-text-muted">
            Cập nhật lần cuối: Tháng 11/2026 · Bản nháp áp dụng cho Dating Journal v2
          </p>
        </header>

        <article className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-text/90 leading-relaxed">
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-text mb-3">1. Nguyên tắc cốt lõi</h2>
            <p className="text-text-muted">
              Dating Journal được xây dựng với phương châm: <strong>không gian riêng tư tuyệt đối chỉ dành cho hai bạn</strong>.
              Chúng tôi không bán dữ liệu, không chia sẻ thông tin cho các bên thứ ba nhằm mục đích quảng cáo thương mại.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-text mb-3">2. Độ tuổi sử dụng</h2>
            <p className="text-text-muted">
              Ứng dụng chỉ dành cho người dùng <strong>từ đủ 16 tuổi trở lên</strong>. Khi đăng ký và hoàn tất bước làm quen (onboarding),
              bạn cần cung cấp ngày sinh để hệ thống xác thực điều kiện độ tuổi tối thiểu trước khi kích hoạt tài khoản.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-text mb-3">3. Dữ liệu chúng tôi thu thập</h2>
            <ul className="list-disc list-inside space-y-2 text-text-muted mt-2">
              <li><strong>Thông tin tài khoản:</strong> Email, tên hiển thị, ngày sinh (phục vụ xác thực tuổi, chiêm tinh và tính năng ngày sinh).</li>
              <li><strong>Dữ liệu kỷ niệm:</strong> Hình ảnh, video, ghi chú, tâm trạng (mood), ngày hẹn, địa điểm và chi tiêu do hai bạn chủ động ghi lại.</li>
              <li><strong>Dữ liệu tương tác:</strong> Thả tim (reactions), bình luận, câu trả lời hàng ngày và wishlist chung.</li>
              <li><strong>Dữ liệu thiết bị &amp; bảo mật:</strong> Mã định danh thiết bị cho thông báo đẩy (Web Push) khi bạn cho phép. Mã PIN khóa app được lưu trữ và băm cục bộ trên thiết bị của bạn.</li>
            </ul>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-text mb-3">4. Bảo mật hình ảnh và tệp phương tiện</h2>
            <p className="text-text-muted">
              Toàn bộ ảnh và video buổi hẹn được lưu trữ trong không gian tệp tin riêng tư (private bucket).
              Đường dẫn tệp được ký điện tử tạm thời (signed URL có hiệu lực tối đa 60 giây) và chỉ cung cấp cho thành viên hợp lệ của couple.
              Người ngoài không thể xem hoặc truy cập tệp ngay cả khi có được đường dẫn gốc.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-text mb-3">5. Xử lý tính năng AI (Google Gemini)</h2>
            <p className="text-text-muted">
              Khi bạn sử dụng các tính năng thông minh như Cupid tư vấn hẹn hò, đọc bài Tarot, thần số học hoặc phân tích ảnh bàn tay (chỉ tay),
              dữ liệu được gửi qua API server-side được mã hóa tới Google Gemini.
              Dữ liệu này chỉ được dùng để phản hồi yêu cầu tức thời của bạn và không lưu giữ cho mục đích huấn luyện mô hình AI công cộng.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-text mb-3">6. Vòng đời dữ liệu, Rời couple và Xóa vĩnh viễn</h2>
            <ul className="list-disc list-inside space-y-2 text-text-muted mt-2">
              <li><strong>Rời couple:</strong> Khi một người xác nhận rời couple (qua 2 bước xác thực), couple sẽ chuyển sang trạng thái giải tán (dissolved). Cả hai thành viên có <strong>30 ngày</strong> để xem lại và tải toàn bộ dữ liệu kỷ niệm dưới dạng tệp nén ZIP. Sau 30 ngày, hệ thống sẽ tự động xóa vĩnh viễn toàn bộ dữ liệu.</li>
              <li><strong>Xóa tài khoản:</strong> Bạn có quyền yêu cầu xóa tài khoản bất cứ lúc nào. Thông tin cá nhân của bạn sẽ được xóa ngay lập tức.</li>
              <li><strong>Xuất dữ liệu:</strong> Bạn có thể chủ động tải về bản sao đầy đủ hình ảnh và thông tin kỷ niệm dạng tệp ZIP từ mục Cài đặt.</li>
            </ul>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-text mb-3">7. Liên hệ phản hồi</h2>
            <p className="text-text-muted">
              Nếu bạn có bất kỳ câu hỏi hoặc yêu cầu nào liên quan đến quyền riêng tư, vui lòng truy cập trang{' '}
              <Link href="/contact" className="text-primary underline font-medium">
                Liên hệ
              </Link>{' '}
              để được hỗ trợ nhanh chóng.
            </p>
          </section>
        </article>
      </main>

      <LandingFooter />
    </div>
  );
}
