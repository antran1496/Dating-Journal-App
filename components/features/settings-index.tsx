'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Heart,
  Palette,
  Shield,
  Bell,
  FileArchive,
  ChevronRight,
  LogOut,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { clearSupabaseTokenCache } from '@/lib/supabase/client';
import type { Profile, CoupleWithMembers } from '@/types';

interface SettingsIndexProps {
  profile: Profile;
  couple: CoupleWithMembers | null;
}

export function SettingsIndex({ profile, couple }: SettingsIndexProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    queryClient.clear();
    clearSupabaseTokenCache();
    await signOut({ redirect: false });
    router.push('/login');
  };

  const partner = couple?.couple_members?.find((m) => m.profile_id !== profile.id)?.profile;

  const sections = [
    {
      group: 'Cài đặt chung',
      items: [
        {
          href: '/settings/profile',
          icon: User,
          color: 'text-primary bg-primary/10',
          title: 'Hồ sơ',
          desc: 'Tên hiển thị, ngày sinh và ảnh đại diện',
        },
        {
          href: '/settings/couple',
          icon: Heart,
          color: 'text-rose-500 bg-rose-500/10',
          title: 'Couple & biệt danh',
          desc: partner ? `Kết đôi cùng ${partner.display_name || 'Người ấy'}, ngày kỷ niệm` : 'Mã mời kết đôi, tình trạng quan hệ',
        },
        {
          href: '/settings/appearance',
          icon: Palette,
          color: 'text-purple-500 bg-purple-500/10',
          title: 'Giao diện',
          desc: 'Chế độ hiển thị, 8 bảng màu, font chữ & tương phản',
        },
      ],
    },
    {
      group: 'Bảo mật & Tiện ích',
      items: [
        {
          href: '/settings/privacy',
          icon: Shield,
          color: 'text-emerald-500 bg-emerald-500/10',
          title: 'Quyền riêng tư và bảo mật',
          desc: 'Khóa app PIN, ẩn màn hình đa nhiệm, ai xem được gì',
        },
        {
          href: '/settings/notifications',
          icon: Bell,
          color: 'text-blue-500 bg-blue-500/10',
          title: 'Thông báo',
          desc: 'Nhắc nhở cuối tuần, câu hỏi hàng ngày, giờ yên lặng',
        },
        {
          href: '/settings/data',
          icon: FileArchive,
          color: 'text-amber-500 bg-amber-500/10',
          title: 'Dữ liệu của bạn',
          desc: 'Xuất file ZIP toàn bộ dữ liệu & ảnh kỷ niệm',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Profile Header Summary */}
      <Link
        href="/settings/profile"
        className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-colors shadow-sm group"
      >
        <div className="flex items-center gap-3.5">
          <Avatar
            src={profile.avatar_url ?? undefined}
            name={profile.display_name ?? 'U'}
            size="lg"
          />
          <div className="space-y-0.5">
            <h3 className="font-heading font-bold text-base text-text">
              {profile.display_name ?? 'Chưa đặt tên'}
            </h3>
            <p className="text-xs text-text-muted">Chạm để chỉnh sửa thông tin cá nhân</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-text transition-colors" />
      </Link>

      {/* Main Settings Sections */}
      {sections.map((sec) => (
        <div key={sec.group} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted px-1">
            {sec.group}
          </h2>
          <Card className="divide-y divide-border border border-border bg-surface overflow-hidden shadow-sm">
            {sec.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-medium text-sm text-text block">{item.title}</span>
                      <span className="text-xs text-text-muted block mt-0.5">{item.desc}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text transition-colors shrink-0" />
                </Link>
              );
            })}
          </Card>
        </div>
      ))}

      {/* Vùng cần cân nhắc */}
      <div className="space-y-2 pt-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted px-1 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Vùng cần cân nhắc
        </h2>
        <Card className="border border-border bg-surface p-4 space-y-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-text block">Rời couple</span>
              <p className="text-xs text-text-muted">
                Dữ liệu chung lưu 30 ngày rồi xóa, bạn có thể xuất trước.
              </p>
            </div>
            <Link href="/settings/data" className="shrink-0 text-xs text-primary font-medium hover:underline pt-0.5">
              Chi tiết →
            </Link>
          </div>

          <div className="pt-2 border-t border-border flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-text block">Xóa tài khoản</span>
              <p className="text-xs text-text-muted">
                Xóa vĩnh viễn toàn bộ dữ liệu cá nhân của bạn trên ứng dụng.
              </p>
            </div>
            <Link href="/settings/data" className="shrink-0 text-xs text-red-500 font-medium hover:underline pt-0.5">
              Xóa →
            </Link>
          </div>
        </Card>
      </div>

      {/* Logout Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất tài khoản'}</span>
        </button>
      </div>
    </div>
  );
}
