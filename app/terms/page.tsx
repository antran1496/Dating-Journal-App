import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { LandingNav, LandingFooter } from '@/components/landing';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Điều khoản dịch vụ — Dating Journal',
  description: 'Điều khoản sử dụng Dating Journal: quy tắc 2 thành viên, bảo mật mã mời, và quy định dịch vụ.',
};

export default async function TermsPage() {
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
            <FileText className="w-3.5 h-3.5" />
            Điều khoản sử dụng
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
            Điều khoản dịch vụ
          </h1>
          <p className="mt-3 text-sm sm:text-base text-text-muted">
            Cập nhật lần cuối: Tháng 11/2026 · Bản nháp quy định cho Dating Journal v2
          </p>
        </header>

        <article className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-text/90 leading-relaxed">
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-text mb-3">1. Chấp thuận điều khoản</h2>
            <p className="text-text-muted">
              Bằng việc đăng ký tài khoản hoặc sử dụng ứng dụng Dating Journal, bạn đồng ý tuân thủ toàn bộ các điều khoản và điều kiện được nêu tại đây. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng ứng dụng.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-text mb-3">2. Điều kiện độ tuổi (≥ 16 tuổi)</h2>
            <p className="text-text-muted">
              Dating Journal chỉ cung cấp dịch vụ cho các cá nhân từ đủ <strong>16 tuổi trở lên</strong>. Bạn có trách nhiệm khai báo chính xác ngày sinh trong quá trình đăng ký. Hệ thống có cơ chế kiểm tra độ tuổi tự động và sẽ từ chối cung cấp dịch vụ cho người dưới 16 tuổi.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-text mb-3">3. Cặp đôi và Giới hạn 2 thành viên</h2>
            <p className="text-text-muted">
              Mỗi không gian cặp đôi (couple) trên Dating Journal được thiết kế và giới hạn nghiêm ngặt ở mức <strong>tối đa 2 thành viên</strong>. Cơ sở dữ liệu và hệ thống kiểm soát quyền truy cập đảm bảo không có người thứ ba tham gia vào không gian chung của hai bạn.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-text mb-3">4. Mã mời và Bảo mật liên kết</h2>
            <p className="text-text-muted">
              Mỗi liên kết mời hoặc mã mời tham gia couple chỉ có hiệu lực trong vòng <strong>48 giờ</strong> và chỉ sử dụng được <strong>một lần duy nhất</strong>. Người tạo lời mời có quyền thu hồi hoặc tạo lại mã mới bất kỳ lúc nào trước khi người kia tham gia.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-text mb-3">5. Nội dung người dùng &amp; Quyền sở hữu chung</h2>
            <p className="text-text-muted">
              Bạn chịu trách nhiệm về mọi nội dung, hình ảnh, văn bản mà bạn đăng tải. Các kỷ niệm được tạo ra trong couple là tài sản chung của cả hai thành viên. Bạn cam kết không tải lên các nội dung vi phạm pháp luật, quấy rối, hoặc vi phạm quyền riêng tư của cá nhân khác.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-text mb-3">6. Rời couple, Giải tán và Xóa vĩnh viễn</h2>
            <p className="text-text-muted">
              Bất kỳ thành viên nào cũng có quyền rời khỏi couple thông qua quy trình xác nhận 2 bước. Khi rời couple, dữ liệu chung sẽ được bảo lưu trong <strong>30 ngày</strong> ở chế độ chỉ đọc và cho phép xuất tệp ZIP. Hết 30 ngày, toàn bộ dữ liệu couple sẽ được xoá vĩnh viễn và không thể khôi phục.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-text mb-3">7. Miễn trừ trách nhiệm tính năng AI &amp; Chiêm tinh</h2>
            <p className="text-text-muted">
              Các tính năng gợi ý thông minh từ AI (Cupid, bói Tarot, thần số học, cung hoàng đạo, chỉ tay) được cung cấp với mục đích giải trí và tạo thêm niềm vui cho mối quan hệ. Chúng tôi không đảm bảo tính chính xác khoa học hay đưa ra bất kỳ lời khuyên mang tính y tế, tài chính hoặc pháp lý nào.
            </p>
          </section>
        </article>
      </main>

      <LandingFooter />
    </div>
  );
}
