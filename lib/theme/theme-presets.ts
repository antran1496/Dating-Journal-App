import type { UserPreferences } from '@/types';

// ---------------------------------------------------------------------------
// Color Palettes
// ---------------------------------------------------------------------------

export interface ColorPalette {
  id: string;
  name: string;
  emoji: string;
  primary: string;
  primaryHover: string;
  primaryFg: string;
  accent: string;
  accentHover: string;
  accentFg: string;
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'rose',
    name: 'Hồng Pastel',
    emoji: '🌸',
    primary: '#ff6b81',
    primaryHover: '#ff4f6a',
    primaryFg: '#ffffff',
    accent: '#c084fc',
    accentHover: '#a855f7',
    accentFg: '#ffffff',
  },
  {
    id: 'lavender',
    name: 'Tím Lavender',
    emoji: '💜',
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    primaryFg: '#ffffff',
    accent: '#ec4899',
    accentHover: '#db2777',
    accentFg: '#ffffff',
  },
  {
    id: 'ocean',
    name: 'Xanh Biển',
    emoji: '🌊',
    primary: '#0ea5e9',
    primaryHover: '#0284c7',
    primaryFg: '#ffffff',
    accent: '#06b6d4',
    accentHover: '#0891b2',
    accentFg: '#ffffff',
  },
  {
    id: 'sunset',
    name: 'Hoàng Hôn',
    emoji: '🌅',
    primary: '#f97316',
    primaryHover: '#ea580c',
    primaryFg: '#ffffff',
    accent: '#eab308',
    accentHover: '#ca8a04',
    accentFg: '#ffffff',
  },
  {
    id: 'forest',
    name: 'Xanh Lá',
    emoji: '🌿',
    primary: '#10b981',
    primaryHover: '#059669',
    primaryFg: '#ffffff',
    accent: '#14b8a6',
    accentHover: '#0d9488',
    accentFg: '#ffffff',
  },
  {
    id: 'cherry',
    name: 'Đỏ Cherry',
    emoji: '🍒',
    primary: '#e11d48',
    primaryHover: '#be123c',
    primaryFg: '#ffffff',
    accent: '#f43f5e',
    accentHover: '#e11d48',
    accentFg: '#ffffff',
  },
  {
    id: 'midnight',
    name: 'Đêm Indigo',
    emoji: '🌙',
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    primaryFg: '#ffffff',
    accent: '#818cf8',
    accentHover: '#6366f1',
    accentFg: '#ffffff',
  },
  {
    id: 'peach',
    name: 'Đào Nhạt',
    emoji: '🍑',
    primary: '#fb923c',
    primaryHover: '#f97316',
    primaryFg: '#ffffff',
    accent: '#f472b6',
    accentHover: '#ec4899',
    accentFg: '#ffffff',
  },
];

// ---------------------------------------------------------------------------
// Font Pairs
// ---------------------------------------------------------------------------

export interface FontPair {
  id: string;
  name: string;
  heading: string;
  body: string;
  /** Google Fonts URL query param (family=...) for dynamic loading */
  googleFontsQuery: string;
  sampleHeading: string;
  sampleBody: string;
}

export const FONT_PAIRS: FontPair[] = [
  {
    id: 'classic',
    name: 'Cổ điển',
    heading: 'Playfair Display',
    body: 'Inter',
    googleFontsQuery: '', // Already loaded via next/font
    sampleHeading: 'Câu chuyện tình yêu',
    sampleBody: 'Mỗi ngày bên nhau là một kỷ niệm đáng nhớ.',
  },
  {
    id: 'modern',
    name: 'Hiện đại',
    heading: 'Outfit',
    body: 'Inter',
    googleFontsQuery: 'family=Outfit:wght@400;500;600;700',
    sampleHeading: 'Câu chuyện tình yêu',
    sampleBody: 'Mỗi ngày bên nhau là một kỷ niệm đáng nhớ.',
  },
  {
    id: 'elegant',
    name: 'Sang trọng',
    heading: 'Cormorant Garamond',
    body: 'Lato',
    googleFontsQuery: 'family=Cormorant+Garamond:wght@400;500;600;700&family=Lato:wght@300;400;700',
    sampleHeading: 'Câu chuyện tình yêu',
    sampleBody: 'Mỗi ngày bên nhau là một kỷ niệm đáng nhớ.',
  },
  {
    id: 'playful',
    name: 'Vui tươi',
    heading: 'Nunito',
    body: 'Nunito Sans',
    googleFontsQuery: 'family=Nunito:wght@400;600;700;800&family=Nunito+Sans:wght@300;400;600',
    sampleHeading: 'Câu chuyện tình yêu',
    sampleBody: 'Mỗi ngày bên nhau là một kỷ niệm đáng nhớ.',
  },
  {
    id: 'minimal',
    name: 'Tối giản',
    heading: 'DM Sans',
    body: 'DM Sans',
    googleFontsQuery: 'family=DM+Sans:wght@300;400;500;600;700',
    sampleHeading: 'Câu chuyện tình yêu',
    sampleBody: 'Mỗi ngày bên nhau là một kỷ niệm đáng nhớ.',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find color palette by primary color hex */
export function findPaletteByColor(primaryColor: string): ColorPalette | undefined {
  return COLOR_PALETTES.find((p) => p.primary.toLowerCase() === primaryColor.toLowerCase());
}

/** Find font pair by heading font name */
export function findFontPairByHeading(headingFont: string): FontPair | undefined {
  return FONT_PAIRS.find((p) => p.heading.toLowerCase() === headingFont.toLowerCase());
}

/** Generate shadow-glow from primary color */
export function generateGlowShadow(primaryHex: string): string {
  return `0 0 20px ${primaryHex}4D`; // 4D = ~30% opacity
}

/** Build default preferences */
export function getDefaultPreferences(): Omit<UserPreferences, 'profile_id'> {
  return {
    theme_mode: 'system',
    primary_color: '#ff6b81',
    font_heading: 'Playfair Display',
    font_body: 'Inter',
  };
}
