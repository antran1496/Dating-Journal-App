'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  HelpCircle,
  Wallet,
  MapPin,
  Clock,
  Sparkles,
  Compass,
  Gift,
  Settings,
  ChevronRight,
} from 'lucide-react';

interface HubItem {
  title: string;
  desc: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  badge?: string;
}

const HUB_ITEMS: HubItem[] = [
  {
    title: 'Cùng nhau',
    desc: 'Những điều hai bạn muốn thử làm cùng nhau',
    href: '/together',
    icon: Users,
    color: 'from-pink-500/20 to-rose-500/20 text-rose-500',
  },
  {
    title: 'Câu hỏi hằng ngày',
    desc: 'Cả hai cùng trả lời mỗi ngày để hiểu nhau hơn',
    href: '/daily',
    icon: HelpCircle,
    color: 'from-purple-500/20 to-indigo-500/20 text-indigo-500',
  },
  {
    title: 'Chi tiêu',
    desc: 'Theo dõi và quản lý ngân sách các buổi hẹn',
    href: '/spending',
    icon: Wallet,
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500',
  },
  {
    title: 'Bản đồ kỷ niệm',
    desc: 'Những nơi hai bạn đã cùng nhau ghi dấu chân',
    href: '/map',
    icon: MapPin,
    color: 'from-blue-500/20 to-cyan-500/20 text-blue-500',
  },
  {
    title: 'Time capsule',
    desc: 'Viết thư hoặc cất ảnh, khóa đến ngày hai bạn hẹn',
    href: '/capsule',
    icon: Clock,
    color: 'from-amber-500/20 to-orange-500/20 text-amber-600',
  },
  {
    title: 'Quiz tình yêu',
    desc: 'Trắc nghiệm ngôn ngữ tình yêu & độ ăn ý',
    href: '/quiz',
    icon: Sparkles,
    color: 'from-fuchsia-500/20 to-pink-500/20 text-fuchsia-500',
  },
  {
    title: 'Khám phá tình yêu',
    desc: 'Thần số học, cung hoàng đạo, Tarot & chỉ tay',
    href: '/insights',
    icon: Compass,
    color: 'from-violet-500/20 to-purple-500/20 text-violet-500',
  },
  {
    title: 'Wrapped',
    desc: 'Tổng kết hành trình yêu theo tháng và năm',
    href: '/wrapped',
    icon: Gift,
    color: 'from-rose-500/20 to-amber-500/20 text-rose-500',
  },
  {
    title: 'Cài đặt',
    desc: 'Hồ sơ, giao diện, quyền riêng tư & bảo mật',
    href: '/settings',
    icon: Settings,
    color: 'from-slate-500/20 to-gray-500/20 text-slate-600 dark:text-slate-300',
  },
];

export default function MoreHubPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-text">
          Tính năng & Tiện ích ✨
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Khám phá thêm các góc kỷ niệm và công cụ dành riêng cho hai bạn
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {HUB_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between p-4 rounded-[var(--radius-xl)] bg-surface border border-border hover:border-primary/40 hover:shadow-sm transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-[var(--radius-lg)] bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-sm sm:text-base text-text truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </h2>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>

              <ChevronRight
                size={18}
                className="text-text-muted/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
