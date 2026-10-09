'use client';

import * as React from 'react';
import type { UserPreferences } from '@/types';
import {
  findPaletteByColor,
  findFontPairByHeading,
  generateGlowShadow,
  COLOR_PALETTES,
  FONT_PAIRS,
} from '@/lib/theme/theme-presets';
import { loadGoogleFont } from '@/lib/theme/font-loader';
import { ensureAccessible, getAccessibleFg } from '@/lib/theme/contrast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  /** Current theme mode (light/dark/system) */
  theme: ThemeMode;
  /** Set theme mode */
  setTheme: (theme: ThemeMode) => void;
  /** Current primary color hex */
  primaryColor: string;
  /** Set primary color by palette ID or raw hex */
  setPrimaryColor: (colorOrPaletteId: string) => void;
  /** Current heading font */
  fontHeading: string;
  /** Current body font */
  fontBody: string;
  /** Set font pair by pair ID */
  setFontPair: (pairId: string) => void;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  enableSystem?: boolean;
  /** Server-loaded initial preferences to avoid flash */
  initialPreferences?: UserPreferences | null;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ThemeProviderContext = React.createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => null,
  primaryColor: '#ff6b81',
  setPrimaryColor: () => null,
  fontHeading: 'Be Vietnam Pro',
  fontBody: 'Be Vietnam Pro',
  setFontPair: () => null,
});

// ---------------------------------------------------------------------------
// Helpers: Apply CSS variables to <html>
// ---------------------------------------------------------------------------

function applyColorPalette(primaryHex: string) {
  const root = document.documentElement;
  const palette = findPaletteByColor(primaryHex);
  const isDark = root.classList.contains('dark');
  const bgHex = isDark ? '#0f172a' : '#ffffff';

  const primary = palette ? palette.primary : primaryHex;
  const primaryStrong = ensureAccessible(primary, bgHex, 4.5);
  const primaryFg = palette ? palette.primaryFg : getAccessibleFg(primary);

  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-primary-strong', primaryStrong);
  root.style.setProperty('--color-primary-hover', palette ? palette.primaryHover : primaryStrong);
  root.style.setProperty('--color-primary-fg', primaryFg);

  if (palette) {
    root.style.setProperty('--color-accent', palette.accent);
    root.style.setProperty('--color-accent-hover', palette.accentHover);
    root.style.setProperty('--color-accent-fg', palette.accentFg);
  } else {
    root.style.setProperty('--color-accent', '#818cf8');
    root.style.setProperty('--color-accent-hover', '#6366f1');
    root.style.setProperty('--color-accent-fg', '#ffffff');
  }

  root.style.setProperty('--shadow-glow', generateGlowShadow(primary));
}

function applyFontPair(heading: string, body: string) {
  const root = document.documentElement;
  if (heading === 'Be Vietnam Pro') {
    root.style.setProperty('--font-heading', 'var(--font-be-vietnam), sans-serif');
    root.style.setProperty('--font-body', 'var(--font-be-vietnam), sans-serif');
  } else {
    root.style.setProperty('--font-heading', `"${heading}", serif`);
    root.style.setProperty('--font-body', `"${body}", sans-serif`);
  }
}

// ---------------------------------------------------------------------------
// Provider Component
// ---------------------------------------------------------------------------

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystem = true,
  initialPreferences,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<ThemeMode>(() => {
    if (typeof window !== 'undefined' && !initialPreferences) {
      const savedTheme = localStorage.getItem('theme-mode') as ThemeMode | null;
      if (savedTheme) return savedTheme;
    }
    return (initialPreferences?.theme_mode as ThemeMode) ?? defaultTheme;
  });

  const [primaryColor, setPrimaryColorState] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const savedColor = localStorage.getItem('theme-primary-color');
      if (savedColor) return savedColor;
    }
    return initialPreferences?.primary_color ?? '#ff6b81';
  });

  const [fontHeading, setFontHeading] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const savedHeading = localStorage.getItem('theme-font-heading');
      if (savedHeading) return savedHeading;
    }
    return initialPreferences?.font_heading ?? 'Be Vietnam Pro';
  });

  const [fontBody, setFontBody] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const savedBody = localStorage.getItem('theme-font-body');
      if (savedBody) return savedBody;
    }
    return initialPreferences?.font_body ?? 'Be Vietnam Pro';
  });

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system' && enableSystem) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';
      root.setAttribute('data-theme', systemTheme);
      root.classList.add(systemTheme);
    } else {
      root.setAttribute('data-theme', theme);
      root.classList.add(theme);
    }

    localStorage.setItem('theme-mode', theme);
  }, [theme, enableSystem]);

  // ---- Color effect ----
  React.useEffect(() => {
    applyColorPalette(primaryColor);
  }, [primaryColor]);

  // ---- Font effect ----
  React.useEffect(() => {
    // Find the font pair and load if needed
    const pair = findFontPairByHeading(fontHeading);
    if (pair && pair.googleFontsQuery) {
      loadGoogleFont(pair.googleFontsQuery).then(() => {
        applyFontPair(fontHeading, fontBody);
      });
    } else {
      applyFontPair(fontHeading, fontBody);
    }
  }, [fontHeading, fontBody]);

  // ---- Setters ----
  const setTheme = React.useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('theme-mode', mode);
  }, []);

  const setPrimaryColor = React.useCallback((colorOrPaletteId: string) => {
    // Allow passing palette ID or hex
    const palette = COLOR_PALETTES.find((p) => p.id === colorOrPaletteId);
    const hex = palette ? palette.primary : colorOrPaletteId;
    setPrimaryColorState(hex);
    localStorage.setItem('theme-primary-color', hex);
  }, []);

  const setFontPair = React.useCallback((pairId: string) => {
    const pair = FONT_PAIRS.find((p) => p.id === pairId);
    if (!pair) return;
    setFontHeading(pair.heading);
    setFontBody(pair.body);
    localStorage.setItem('theme-font-heading', pair.heading);
    localStorage.setItem('theme-font-body', pair.body);
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      primaryColor,
      setPrimaryColor,
      fontHeading,
      fontBody,
      setFontPair,
    }),
    [theme, setTheme, primaryColor, setPrimaryColor, fontHeading, fontBody, setFontPair]
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
