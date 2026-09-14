'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Calendar, User, Sparkles, MessageCircle, Settings, MoreHorizontal } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import type { Profile } from '@/types';

const navItems = [
  { label: 'Tổng quan', href: '/dashboard', icon: Heart },
  { label: 'Hẹn hò', href: '/dates', icon: Calendar },
  { label: 'Khám phá', href: '/insights', icon: Sparkles },
  { label: 'Chat AI', href: '/chat', icon: MessageCircle },
  { label: 'Cài đặt', href: '/settings', icon: Settings },
];

interface AppSidebarProps {
  profile: Profile | null;
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);

  return (
    <>
      {/* Desktop Top Navbar */}
      <header className="hidden md:flex items-center justify-between border-b border-border bg-surface/50 backdrop-blur-xl px-6 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <span className="font-heading font-bold text-xl tracking-tight text-text mr-8">Dating Journal</span>
        </div>

        <nav className="flex-1 flex items-center gap-2 justify-center">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-fg font-medium shadow-sm'
                    : 'text-text-muted hover:bg-surface-hover hover:text-text'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-primary-fg' : ''}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 ml-8">
          <Link href="/settings" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-surface/80 backdrop-blur-xl z-40 pb-safe">
        <div className="flex justify-around p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-[var(--radius-md)] transition-colors ${
                  isActive ? 'text-primary' : 'text-text-muted'
                }`}
              >
                <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-primary/20' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
