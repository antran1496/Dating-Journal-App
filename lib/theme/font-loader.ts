/**
 * Dynamic Google Fonts loader.
 * Loads fonts on-demand by injecting <link> tags into <head>.
 * Caches already-loaded fonts to prevent duplicate requests.
 */

const loadedFonts = new Set<string>();

/**
 * Load a Google Fonts stylesheet by its query string.
 * @param googleFontsQuery - The `family=...` part of the Google Fonts URL.
 *   Example: `"family=Outfit:wght@400;500;600;700"`
 * @returns Promise that resolves when the font stylesheet is loaded.
 */
export function loadGoogleFont(googleFontsQuery: string): Promise<void> {
  // Skip empty queries (fonts already loaded via next/font)
  if (!googleFontsQuery) return Promise.resolve();

  // Skip if already loaded
  if (loadedFonts.has(googleFontsQuery)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    // Check if this exact link already exists in DOM
    const existingLink = document.querySelector(
      `link[href*="${encodeURI(googleFontsQuery)}"]`
    );
    if (existingLink) {
      loadedFonts.add(googleFontsQuery);
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${googleFontsQuery}&display=swap`;

    link.onload = () => {
      loadedFonts.add(googleFontsQuery);
      resolve();
    };

    link.onerror = () => {
      reject(new Error(`Failed to load font: ${googleFontsQuery}`));
    };

    document.head.appendChild(link);
  });
}

/**
 * Preload font pairs for the font selector preview.
 * Loads all non-default font pairs in background.
 */
export function preloadAllFonts(fontQueries: string[]): void {
  for (const query of fontQueries) {
    if (query) {
      loadGoogleFont(query).catch(() => {
        // Silently fail — fonts are cosmetic
      });
    }
  }
}
