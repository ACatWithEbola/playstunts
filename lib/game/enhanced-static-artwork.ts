export const ENHANCED_STATIC_ARTWORK = {
  prod: '/site/enhanced-artwork/SDTITL-prod-mindscape-v1.png',
  titl: '/site/enhanced-artwork/SDTITL-titl-title-v2.png',
  mainMenu: '/site/enhanced-artwork/SDMSEL-scrn-menu-display-v1.webp',
  mainMenuTexture: '/site/enhanced-artwork/SDMSEL-scrn-menu-v1.webp',
} as const;

/** Load optional enhanced artwork without making the original game dependent on it. */
export function loadEnhancedStaticArtwork(source: string) {
  return new Promise<HTMLImageElement | undefined>((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(undefined);
    image.src = source;
  });
}
