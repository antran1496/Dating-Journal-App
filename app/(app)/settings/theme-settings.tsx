'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { Sun, Moon, Monitor, Check, Palette, Globe } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import {
  COLOR_PALETTES,
  FONT_PAIRS,
  findPaletteByColor,
  findFontPairByHeading,
} from '@/lib/theme/theme-presets';
import { preloadAllFonts } from '@/lib/theme/font-loader';
import type { Locale } from '@/lib/i18n/translations';

export default function ThemeSettingsPage() {
  const { theme, setTheme, primaryColor, setPrimaryColor, fontHeading, setFontPair } = useTheme();
  const { locale, setLocale, t } = useLocale();
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

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    debouncedSave({ locale: newLocale });
  };

  // Find currently active palette/font
  const activePalette = findPaletteByColor(primaryColor);
  const activeFontPair = findFontPairByHeading(fontHeading);

  const themeModes = [
    { mode: 'light' as const, label: t('theme.light'), icon: Sun },
    { mode: 'dark' as const, label: t('theme.dark'), icon: Moon },
    { mode: 'system' as const, label: t('theme.auto'), icon: Monitor },
  ];

  const languages = [
    { code: 'vi' as Locale, label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en' as Locale, label: 'English', flag: '🇬🇧' },
  ];

  return (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">

      {/* ---- Section 1: Theme Mode ---- */}
      <div>
        <p className="text-sm font-medium text-text mb-2">{t('theme.display_mode')}</p>
        <div className="grid grid-cols-3 gap-2">
          {themeModes.map(({ mode, label, icon: Icon }) => {
            const isActive = theme === mode;
            return (
              <button
                key={mode}
                onClick={() => handleThemeChange(mode)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-[var(--radius-md)] border-2 transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-text-muted'}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-text-muted'}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- Section 2: Color Palette ---- */}
      <div>
        <p className="text-sm font-medium text-text mb-2">{t('theme.primary_color')}</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTES.map((palette) => {
            const isActive = activePalette?.id === palette.id;
            return (
              <button
                key={palette.id}
                onClick={() => handleColorChange(palette.id)}
                title={palette.name}
                className={`relative w-10 h-10 rounded-full transition-all duration-200 cursor-pointer ${
                  isActive ? 'ring-2 ring-offset-2 ring-offset-surface scale-110' : 'hover:scale-110'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
                  ...(isActive ? { '--tw-ring-color': palette.primary } : {}),
                } as React.CSSProperties}
              >
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white drop-shadow-md" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- Section 3: Font Pair ---- */}
      <div>
        <p className="text-sm font-medium text-text mb-2">{t('theme.font')}</p>
        <div className="space-y-2">
          {FONT_PAIRS.map((pair) => {
            const isActive = activeFontPair?.id === pair.id;
            return (
              <button
                key={pair.id}
                onClick={() => handleFontChange(pair.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] border-2 transition-all duration-200 cursor-pointer text-left ${
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isActive ? 'border-primary bg-primary' : 'border-border'
                  }`}
                >
                  {isActive && <Check className="w-2.5 h-2.5 text-primary-fg" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold text-text truncate"
                    style={{ fontFamily: `"${pair.heading}", serif` }}
                  >
                    {pair.sampleHeading}
                  </p>
                  <p
                    className="text-xs text-text-muted"
                    style={{ fontFamily: `"${pair.body}", sans-serif` }}
                  >
                    {pair.sampleBody}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-primary text-primary-fg' : 'bg-surface-hover text-text-muted'
                  }`}
                >
                  {pair.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- Section 4: Language ---- */}
      <div>
        <p className="text-sm font-medium text-text mb-2">{t('theme.language')}</p>
        <div className="grid grid-cols-2 gap-2">
          {languages.map(({ code, label, flag }) => {
            const isActive = locale === code;
            return (
              <button
                key={code}
                onClick={() => handleLocaleChange(code)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] border-2 transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <span className="text-lg">{flag}</span>
                <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-text'}`}>{label}</span>
                {isActive && <Check className="w-4 h-4 text-primary ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto-save notice */}
      <p className="text-center text-xs text-text-muted pb-4">
        {t('theme.auto_save')}
      </p>
    </div>
  );
}
