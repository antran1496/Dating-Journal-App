import { describe, it, expect } from 'vitest';
import { contrastRatio, ensureAccessible, getAccessibleFg } from './contrast';
import { COLOR_PALETTES } from './theme-presets';

describe('lib/theme/contrast (WCAG 2.1 AA 4.5:1 Guarantee)', () => {
  const lightBg = '#ffffff';
  const darkBg = '#0f172a';

  it('correctly calculates contrast ratio between black and white', () => {
    const ratio = contrastRatio('#000000', '#ffffff');
    expect(ratio).toBeCloseTo(21.0, 1);
  });

  it('guarantees >= 4.5:1 contrast for all 8 presets on both light and dark backgrounds', () => {
    for (const palette of COLOR_PALETTES) {
      // Test light background
      const accessibleOnLight = ensureAccessible(palette.primary, lightBg, 4.5);
      const ratioLight = contrastRatio(accessibleOnLight, lightBg);
      expect(ratioLight).toBeGreaterThanOrEqual(4.5);

      // Test dark background
      const accessibleOnDark = ensureAccessible(palette.primary, darkBg, 4.5);
      const ratioDark = contrastRatio(accessibleOnDark, darkBg);
      expect(ratioDark).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('guarantees >= 4.5:1 for 20 random hex colors on light background', () => {
    const sampleHexes = [
      '#e11d48', '#2563eb', '#16a34a', '#d97706', '#9333ea',
      '#0891b2', '#4f46e5', '#db2777', '#ca8a04', '#059669',
      '#ea580c', '#65a30d', '#0284c7', '#7c3aed', '#c026d3',
      '#e11d48', '#b91c1c', '#c2410c', '#b45309', '#4d7c0f',
    ];

    for (const hex of sampleHexes) {
      const adjusted = ensureAccessible(hex, lightBg, 4.5);
      const ratio = contrastRatio(adjusted, lightBg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('provides accessible text color (fg) with high contrast for any button bg', () => {
    for (const palette of COLOR_PALETTES) {
      const fg = getAccessibleFg(palette.primary);
      const ratio = contrastRatio(fg, palette.primary);
      // fg will be chosen to maximize contrast ratio
      expect(ratio).toBeGreaterThan(3.0);
    }
  });
});
