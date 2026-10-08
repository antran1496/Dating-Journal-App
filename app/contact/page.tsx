import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, HeartHandshake } from 'lucide-react';
import { LandingNav, LandingFooter } from '@/components/landing';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Liên hệ hỗ trợ — Dating Journal',
  description: 'Kênh liên hệ hỗ trợ, đóng góp ý kiến hoặc phản hồi bảo mật cho Dating Journal.',
};

export default async function ContactPage() {
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
            <HeartHandshake className="w-3.5 h-3.5" />
            Đồng hành cùng bạn
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
            Liên hệ &amp; Hỗ trợ
          </h1>
          <p className="mt-3 text-sm sm:text-base text-text-muted">
            Chúng mình luôn sẵn sàng lắng nghe mọi đóng góp, thắc mắc hoặc yêu cầu trợ giúp từ hai bạn.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-7 shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="font-heading text-lg font-bold text-text mb-2">Hỗ trợ kỹ thuật &amp; Quyền riêng tư</h2>
            <p className="text-sm text-text-muted leading-relaxed mb-4">
              Gửi email cho đội ngũ phát triển về các sự cố tài khoản, quyền bảo mật hoặc yêu cầu xóa dữ liệu:
            </p>
            <a
              href="mailto:support@datingjournal.app"
              className="text-base font-semibold text-primary hover:underline"
            >
              support@datingjournal.app
            </a>
          </div>

          <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-7 shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-5">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="font-heading text-lg font-bold text-text mb-2">Đóng góp ý tưởng &amp; Phản hồi</h2>
            <p className="text-sm text-text-muted leading-relaxed mb-4">
              Bạn có mong muốn thêm tính năng mới hoặc muốn giao diện dễ thương hơn? Hãy chia sẻ với chúng mình nhé!
            </p>
            <p className="text-sm font-medium text-text-muted">
              Thời gian phản hồi thông thường: Trong vòng 24–48 giờ làm việc.
            </p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
