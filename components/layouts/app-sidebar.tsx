'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Calendar, User, Sparkles, MessageCircle, Settings } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import type { Profile } from '@/types';

const navItems = [
  { label: 'Tổng quan', href: '/dashboard', icon: Heart },
  { label: 'Hẹn hò', href: '/dates', icon: Calendar },
  { label: 'Khám phá', href: '/insights', icon: Sparkles },
  { label: 'Chat AI', href: '/chat', icon: MessageCircle },
  { label: 'Hồ sơ', href: '/profile', icon: User },
  { label: 'Cài đặt', href: '/settings', icon: Settings },
];

interface AppSidebarProps {
  profile: Profile | null;
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-surface/50 backdrop-blur-xl p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-2 py-4 mb-6">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <span className="font-heading font-bold text-xl tracking-tight text-text">Dating Journal</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-fg font-medium shadow-sm'
                    : 'text-text-muted hover:bg-surface-hover hover:text-text'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-fg' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-3 flex items-center gap-3 border-t border-border">
          <Avatar
            src={profile?.avatar_url ?? undefined}
            name={profile?.display_name ?? 'U'}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text truncate">{profile?.display_name ?? 'Hồ sơ'}</p>
            <Link href="/profile" className="text-xs text-text-muted hover:text-primary transition-colors truncate block">
              Xem hồ sơ
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-surface/80 backdrop-blur-xl z-50">
        <div className="flex justify-around p-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-[var(--radius-md)] transition-colors ${
                  isActive ? 'text-primary' : 'text-text-muted'
                }`}
              >
                <item.icon className={`w-5 h-5 mb-0.5 ${isActive ? 'fill-primary/20' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
