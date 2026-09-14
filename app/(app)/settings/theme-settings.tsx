'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { Sun, Moon, Monitor, Check, Palette } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import {
  COLOR_PALETTES,
  FONT_PAIRS,
  findPaletteByColor,
  findFontPairByHeading,
} from '@/lib/theme/theme-presets';
import { preloadAllFonts } from '@/lib/theme/font-loader';

export default function ThemeSettingsPage() {
  const { theme, setTheme, primaryColor, setPrimaryColor, fontHeading, setFontPair } = useTheme();
  const { preferences, updatePreferences } = useUserPreferences();

  // Debounced save to Supabase
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(
    (updates: Record<string, string>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        updatePreferences(updates).catch((err: Error) =>
          console.error('[ThemeSettings] save failed:', err)
        );
      }, 600);
    },
    [updatePreferences]
  );

  // Preload all fonts for preview on mount
  useEffect(() => {
    preloadAllFonts(FONT_PAIRS.map((p) => p.googleFontsQuery));
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // ---- Handlers ----
  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setTheme(mode);
    debouncedSave({ theme_mode: mode });
  };

  const handleColorChange = (paletteId: string) => {
    const palette = COLOR_PALETTES.find((p) => p.id === paletteId);
    if (!palette) return;
    setPrimaryColor(paletteId);
    debouncedSave({ primary_color: palette.primary });
  };

  const handleFontChange = (pairId: string) => {
    const pair = FONT_PAIRS.find((p) => p.id === pairId);
    if (!pair) return;
    setFontPair(pairId);
    debouncedSave({ font_heading: pair.heading, font_body: pair.body });
  };

  // Find currently active palette/font
  const activePalette = findPaletteByColor(primaryColor);
  const activeFontPair = findFontPairByHeading(fontHeading);

  const themeModes = [
    { mode: 'light' as const, label: 'Sáng', icon: Sun, description: 'Giao diện sáng, nhẹ nhàng' },
    { mode: 'dark' as const, label: 'Tối', icon: Moon, description: 'Giao diện tối, dễ chịu mắt' },
    { mode: 'system' as const, label: 'Tự động', icon: Monitor, description: 'Theo thiết bị của bạn' },
  ];

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-text flex items-center gap-2">
          <Palette className="w-7 h-7 text-primary" />
          Tùy chỉnh giao diện
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Cá nhân hóa màu sắc, font chữ và chế độ hiển thị
        </p>
      </div>

      {/* ---- Section 1: Theme Mode ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Chế độ hiển thị</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeModes.map(({ mode, label, icon: Icon, description }) => {
              const isActive = theme === mode;
              return (
                <button
                  key={mode}
                  onClick={() => handleThemeChange(mode)}
                  className={`relative flex flex-col items-center gap-3 p-5 rounded-[var(--radius-lg)] border-2 transition-all duration-200 cursor-pointer group ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/30 hover:bg-surface-hover'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-fg" />
                    </div>
                  )}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-primary text-primary-fg scale-110'
                        : 'bg-surface-hover text-text-muted group-hover:scale-105'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className={`font-medium text-sm ${isActive ? 'text-primary' : 'text-text'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* ---- Section 2: Color Palette ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Màu chủ đạo</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COLOR_PALETTES.map((palette) => {
              const isActive = activePalette?.id === palette.id;
              return (
                <button
                  key={palette.id}
                  onClick={() => handleColorChange(palette.id)}
                  className={`relative flex items-center gap-3 p-3 rounded-[var(--radius-md)] border-2 transition-all duration-200 cursor-pointer group ${
                    isActive
                      ? 'border-current shadow-sm'
                      : 'border-border hover:border-current/30'
                  }`}
                  style={{
                    // Use the palette color for the border when active
                    color: palette.primary,
                  }}
                >
                  {/* Color swatch */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full transition-transform duration-200 ${
                        isActive ? 'scale-110 ring-2 ring-offset-2 ring-offset-surface' : 'group-hover:scale-105'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
                        outlineColor: isActive ? palette.primary : undefined,
                      }}
                    />
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-left min-w-0">
                    <p className="text-xs text-text-muted">{palette.emoji}</p>
                    <p className={`text-sm font-medium truncate ${isActive ? '' : 'text-text'}`}>
                      {palette.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Preview */}
          <div className="mt-5 p-4 rounded-[var(--radius-lg)] bg-surface-hover border border-border">
            <p className="text-xs text-text-muted mb-3">Xem trước</p>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary animate-[pulse-glow_2s_ease-in-out_infinite]" />
              <span className="text-sm font-medium text-text">Màu chủ đạo hiện tại</span>
              <span
                className="ml-auto text-xs font-mono px-2 py-1 rounded-[var(--radius-sm)] bg-primary/10 text-primary"
              >
                {primaryColor}
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              <div className="flex-1 h-2 rounded-full bg-primary" />
              <div className="flex-1 h-2 rounded-full bg-accent" />
              <div className="flex-1 h-2 rounded-full bg-primary/30" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ---- Section 3: Font Pair ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Font chữ</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {FONT_PAIRS.map((pair) => {
              const isActive = activeFontPair?.id === pair.id;
              return (
                <button
                  key={pair.id}
                  onClick={() => handleFontChange(pair.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-[var(--radius-md)] border-2 transition-all duration-200 cursor-pointer text-left group ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/30 hover:bg-surface-hover'
                  }`}
                >
                  {/* Check indicator */}
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isActive
                        ? 'border-primary bg-primary'
                        : 'border-border group-hover:border-primary/50'
                    }`}
                  >
                    {isActive && <Check className="w-3 h-3 text-primary-fg" />}
                  </div>

                  {/* Sample text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-lg font-bold text-text truncate"
                      style={{ fontFamily: `"${pair.heading}", serif` }}
                    >
                      {pair.sampleHeading}
                    </p>
                    <p
                      className="text-sm text-text-muted mt-0.5"
                      style={{ fontFamily: `"${pair.body}", sans-serif` }}
                    >
                      {pair.sampleBody}
                    </p>
                  </div>

                  {/* Label badge */}
                  <div className="flex-shrink-0">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-[var(--radius-full)] ${
                        isActive
                          ? 'bg-primary text-primary-fg'
                          : 'bg-surface-hover text-text-muted'
                      }`}
                    >
                      {pair.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Auto-save notice */}
      <p className="text-center text-xs text-text-muted pb-4">
        ✨ Mọi thay đổi được lưu tự động
      </p>
    </div>
  );
}
