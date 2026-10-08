import React from 'react';
import { Camera, Heart, Calendar, MessageSquareHeart, Sparkles, Gift } from 'lucide-react';

const FEATURES = [
  {
    icon: Camera,
    title: 'Ghi nhanh trong 10 giây',
    description: 'Một ảnh, một dòng, một mood. Lưu xong trước khi ra khỏi quán.',
    accent: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
  },
  {
    icon: Heart,
    title: 'Thả tim cho nhau',
    description: 'Người kia reaction và bình luận để bạn biết họ đã xem.',
    accent: 'text-pink-500 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-900',
  },
  {
    icon: Calendar,
    title: 'Lịch đếm ngày yêu',
    description: 'Mỗi ô trên lịch là một ngày bên nhau. Chạm để xem hoặc ghi mới.',
    accent: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
  },
  {
    icon: MessageSquareHeart,
    title: 'Câu hỏi mỗi ngày',
    description: 'Cả hai trả lời xong mới cùng mở. Giữ chuỗi ngày bên nhau.',
    accent: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900',
  },
  {
    icon: Sparkles,
    title: 'Cupid và Khám phá',
    description: 'Gợi ý hẹn theo ngân sách, tarot, thần số học, cung hoàng đạo, chỉ tay.',
    accent: 'text-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-200 dark:border-fuchsia-900',
  },
  {
    icon: Gift,
    title: 'Wrapped để khoe',
    description: 'Thẻ tổng kết tháng, thẻ mốc 100 ngày. Địa điểm chính xác được ẩn.',
    accent: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-16 md:py-24 border-t border-border bg-surface/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text tracking-tight">
            Mọi thứ hai bạn cần, không thừa thứ nào
          </h2>
          <p className="mt-3.5 text-base sm:text-lg text-text-muted">
            Ghi kỷ niệm, đếm ngày, reaction và wishlist, tất cả đều sẵn sàng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 sm:p-7 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${item.accent}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-lg sm:text-xl text-text mb-2.5">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-text-muted leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
