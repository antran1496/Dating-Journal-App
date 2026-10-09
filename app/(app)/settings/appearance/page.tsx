'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Palette } from 'lucide-react';
import ThemeSettingsClient from '../theme-settings';

export default function AppearanceSettingsPage() {
  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 -ml-2 text-text-muted hover:text-text rounded-full hover:bg-surface-hover transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text flex items-center gap-2">
            <Palette className="w-6 h-6 text-primary" />
            Giao diện
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5">
            Mọi thay đổi được lưu tự động ✨
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
        <ThemeSettingsClient />
      </div>
    </div>
  );
}
