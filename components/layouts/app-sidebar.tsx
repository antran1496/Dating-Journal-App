'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Calendar, Sparkles, MoreHorizontal, Plus } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import type { Profile } from '@/types';

interface AppSidebarProps {
  profile: Profile | null;
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname();

  const isMoreActive =
    pathname === '/more' ||
    pathname.startsWith('/together') ||
    pathname.startsWith('/daily') ||
    pathname.startsWith('/spending') ||
    pathname.startsWith('/map') ||
    pathname.startsWith('/capsule') ||
    pathname.startsWith('/quiz') ||
    pathname.startsWith('/insights') ||
    pathname.startsWith('/wrapped');

  const desktopNavItems = [
    {
      label: 'Trang chủ',
      href: '/dashboard',
      icon: Heart,
      isActive: pathname === '/dashboard',
    },
    {
      label: 'Hẹn hò',
      href: '/dates',
      icon: Calendar,
      isActive: pathname.startsWith('/dates') && pathname !== '/dates/new',
    },
    {
      label: 'Cupid',
      href: '/chat',
      icon: Sparkles,
      isActive: pathname.startsWith('/chat') || pathname.startsWith('/cupid'),
    },
    {
      label: 'Thêm',
      href: '/more',
      icon: MoreHorizontal,
      isActive: isMoreActive,
    },
  ];

  return (
    <>
      {/* Desktop Top Navbar */}
      <header className="hidden md:flex items-center justify-between border-b border-border bg-surface/80 backdrop-blur-xl px-6 md:px-8 py-3.5 sticky top-0 z-40 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="Dating Journal Logo" className="h-8 w-auto object-contain" />
          <span className="font-heading font-bold text-xl tracking-tight text-text mr-8">
            Dating Journal
          </span>
        </Link>

        <nav className="flex-1 flex items-center gap-2 justify-center">
          {desktopNavItems.map((item) => {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  item.isActive
                    ? 'bg-primary text-white font-medium shadow-xs'
                    : 'text-text-muted hover:bg-surface-hover hover:text-text'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 ml-8">
          <Link
            href="/settings"
            className="flex items-center gap-2.5 hover:opacity-85 transition-opacity"
            title="Hồ sơ & Cài đặt"
          >
            <div className="text-right hidden lg:block">
              <p className="text-sm font-medium text-text">{profile?.display_name ?? 'Hồ sơ'}</p>
            </div>
            <Avatar
              src={profile?.avatar_url ?? undefined}
              name={profile?.display_name ?? 'U'}
              size="sm"
            />
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Nav Bar (D16) */}
      {!pathname.startsWith('/couple/setup') && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-surface/90 backdrop-blur-xl z-40 pb-safe">
          <div className="relative flex items-center justify-around px-2 py-1.5">
            {/* 1. Trang chủ */}
            <Link
              href="/dashboard"
              className={`flex flex-col items-center py-1 px-2 rounded-[var(--radius-md)] transition-colors ${
                pathname === '/dashboard' ? 'text-primary font-semibold' : 'text-text-muted'
              }`}
            >
              <Heart
                className={`w-5 h-5 mb-0.5 ${
                  pathname === '/dashboard' ? 'fill-primary/20 stroke-primary' : ''
                }`}
              />
              <span className="text-[10px]">Trang chủ</span>
            </Link>

            {/* 2. Hẹn hò */}
            <Link
              href="/dates"
              className={`flex flex-col items-center py-1 px-2 rounded-[var(--radius-md)] transition-colors ${
                pathname.startsWith('/dates') && pathname !== '/dates/new'
                  ? 'text-primary font-semibold'
                  : 'text-text-muted'
              }`}
            >
              <Calendar
                className={`w-5 h-5 mb-0.5 ${
                  pathname.startsWith('/dates') && pathname !== '/dates/new'
                    ? 'fill-primary/20 stroke-primary'
                    : ''
                }`}
              />
              <span className="text-[10px]">Hẹn hò</span>
            </Link>

            {/* 3. Center FAB: Ghi nhanh ➕ */}
            <div className="relative -mt-6">
              <Link
                href="/dates/new"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-accent text-white shadow-lg ring-4 ring-surface active:scale-95 transition-transform"
                aria-label="Ghi nhanh buổi hẹn mới"
              >
                <Plus size={24} strokeWidth={2.5} />
              </Link>
            </div>

            {/* 4. Cupid */}
            <Link
              href="/chat"
              className={`flex flex-col items-center py-1 px-2 rounded-[var(--radius-md)] transition-colors ${
                pathname.startsWith('/chat') || pathname.startsWith('/cupid')
                  ? 'text-primary font-semibold'
                  : 'text-text-muted'
              }`}
            >
              <Sparkles
                className={`w-5 h-5 mb-0.5 ${
                  pathname.startsWith('/chat') || pathname.startsWith('/cupid')
                    ? 'fill-primary/20 stroke-primary'
                    : ''
                }`}
              />
              <span className="text-[10px]">Cupid</span>
            </Link>

            {/* 5. Thêm */}
            <Link
              href="/more"
              className={`flex flex-col items-center py-1 px-2 rounded-[var(--radius-md)] transition-colors ${
                isMoreActive ? 'text-primary font-semibold' : 'text-text-muted'
              }`}
            >
              <MoreHorizontal className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Thêm</span>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
