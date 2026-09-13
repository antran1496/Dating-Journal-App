'use client';

import { useEffect } from 'react';
import { useTheme } from '@/components/providers/theme-provider';
import { FONT_PAIRS } from '@/lib/theme/theme-presets';
import type { UserPreferences } from '@/types';

interface ThemeApplierProps {
  preferences: UserPreferences | null;
}

/**
 * Client component that applies server-loaded preferences to ThemeProvider on mount.
 * Renders nothing — only runs side effects.
 */
export function ThemeApplier({ preferences }: ThemeApplierProps) {
  const { setTheme, setPrimaryColor, setFontPair } = useTheme();

  useEffect(() => {
    if (!preferences) return;

    // Apply theme mode
    if (preferences.theme_mode) {
      setTheme(preferences.theme_mode);
    }

    // Apply primary color
    if (preferences.primary_color) {
      setPrimaryColor(preferences.primary_color);
    }

    // Apply font pair by heading font name
    if (preferences.font_heading) {
      const pair = FONT_PAIRS.find(
        (p) => p.heading.toLowerCase() === preferences.font_heading.toLowerCase()
      );
      if (pair) {
        setFontPair(pair.id);
      }
    }
  }, [preferences, setTheme, setPrimaryColor, setFontPair]);

  return null;
}
