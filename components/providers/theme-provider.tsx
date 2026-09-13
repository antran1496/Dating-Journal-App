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
  fontHeading: 'Playfair Display',
  fontBody: 'Inter',
  setFontPair: () => null,
});

// ---------------------------------------------------------------------------
// Helpers: Apply CSS variables to <html>
// ---------------------------------------------------------------------------

function applyColorPalette(primaryHex: string) {
  const root = document.documentElement;
  const palette = findPaletteByColor(primaryHex);

  if (palette) {
    root.style.setProperty('--color-primary', palette.primary);
    root.style.setProperty('--color-primary-hover', palette.primaryHover);
    root.style.setProperty('--color-primary-fg', palette.primaryFg);
    root.style.setProperty('--color-accent', palette.accent);
    root.style.setProperty('--color-accent-hover', palette.accentHover);
    root.style.setProperty('--color-accent-fg', palette.accentFg);
  } else {
    // Custom color — just set primary, keep accent as default
    root.style.setProperty('--color-primary', primaryHex);
    root.style.setProperty('--color-primary-fg', '#ffffff');
  }

  root.style.setProperty('--shadow-glow', generateGlowShadow(primaryHex));
}

function applyFontPair(heading: string, body: string) {
  const root = document.documentElement;
  root.style.setProperty('--font-heading', `"${heading}", serif`);
  root.style.setProperty('--font-body', `"${body}", sans-serif`);
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
  const [theme, setThemeState] = React.useState<ThemeMode>(
    (initialPreferences?.theme_mode as ThemeMode) ?? defaultTheme
  );
  const [primaryColor, setPrimaryColorState] = React.useState(
    initialPreferences?.primary_color ?? '#ff6b81'
  );
  const [fontHeading, setFontHeading] = React.useState(
    initialPreferences?.font_heading ?? 'Playfair Display'
  );
  const [fontBody, setFontBody] = React.useState(
    initialPreferences?.font_body ?? 'Inter'
  );

  // ---- Theme mode effect ----
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme-mode') as ThemeMode | null;
    if (savedTheme && !initialPreferences) {
      setThemeState(savedTheme);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ---- Apply initial preferences on mount ----
  React.useEffect(() => {
    if (initialPreferences) {
      const savedColor = localStorage.getItem('theme-primary-color');
      const savedHeading = localStorage.getItem('theme-font-heading');
      const savedBody = localStorage.getItem('theme-font-body');

      if (savedColor) setPrimaryColorState(savedColor);
      if (savedHeading) setFontHeading(savedHeading);
      if (savedBody) setFontBody(savedBody);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
