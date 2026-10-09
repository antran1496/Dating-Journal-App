/**
 * WCAG 2.1 Color Contrast Utilities & Automatic Accessibility Guarantee (4.5:1)
 */

export function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace(/^#/, '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Calculates WCAG relative luminance of an sRGB color.
 */
export function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates WCAG contrast ratio between two colors (range: 1.0 to 21.0).
 */
export function contrastRatio(colorA: string, colorB: string): number {
  const lumA = getLuminance(colorA);
  const lumB = getLuminance(colorB);
  const brighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (brighter + 0.05) / (darker + 0.05);
}

// HSL conversion helpers
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = (h % 360) / 360;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
}

/**
 * Adjusts lightness L while preserving hue and saturation until WCAG contrast ratio >= minRatio (default 4.5).
 */
export function ensureAccessible(hex: string, bgHex: string, minRatio: number = 4.5): string {
  const currentRatio = contrastRatio(hex, bgHex);
  if (currentRatio >= minRatio) return hex;

  const [r, g, b] = hexToRgb(hex);
  const [h, s] = rgbToHsl(r, g, b);
  const bgLum = getLuminance(bgHex);
  const shouldDarken = bgLum > 0.4; // Darken on light background, lighten on dark background

  const stepL = shouldDarken ? -0.02 : 0.02;
  let [, , curL] = rgbToHsl(r, g, b);
  let bestHex = hex;

  for (let i = 0; i < 50; i++) {
    curL = Math.max(0.02, Math.min(0.98, curL + stepL));
    const [nr, ng, nb] = hslToRgb(h, s, curL);
    const testHex = rgbToHex(nr, ng, nb);
    const testRatio = contrastRatio(testHex, bgHex);

    if (testRatio >= minRatio) {
      return testHex;
    }
    bestHex = testHex;
  }

  return bestHex;
}

/**
 * Returns accessible text color (#ffffff or #0f172a) for a button background.
 */
export function getAccessibleFg(bgHex: string): string {
  const whiteRatio = contrastRatio('#ffffff', bgHex);
  const darkRatio = contrastRatio('#0f172a', bgHex);
  return whiteRatio >= darkRatio ? '#ffffff' : '#0f172a';
}
