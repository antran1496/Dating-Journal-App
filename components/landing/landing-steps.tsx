import React from 'react';

const STEPS = [
  {
    step: 'Bước 1',
    title: 'Đăng nhập nhanh',
    description: 'Google, Apple hoặc mật khẩu email.',
  },
  {
    step: 'Bước 2',
    title: 'Mời người ấy',
    description: 'Một link dùng một lần, hết hạn sau 48 giờ.',
  },
  {
    step: 'Bước 3',
    title: 'Ghi buổi hẹn đầu tiên',
    description: 'Chỉ cần một ảnh hoặc một dòng chữ.',
  },
];

export function LandingSteps() {
  return (
    <section className="py-16 md:py-24 border-t border-border bg-surface/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-text tracking-tight">
            Bắt đầu mất 3 phút
          </h2>
          <p className="mt-3 text-base text-text-muted">
            Kết nối hai bạn dễ dàng chỉ trong vài bước đơn giản.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {STEPS.map((item, idx) => (
            <div
              key={idx}
              className="rounded-[var(--radius-xl)] border border-border bg-surface p-7 shadow-[var(--shadow-card)] flex flex-col items-start"
            >
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
                {item.step}
              </span>
              <h3 className="font-heading font-bold text-xl text-text mb-2">
                {item.title}
              </h3>
              <p className="text-sm sm:text-base text-text-muted leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
