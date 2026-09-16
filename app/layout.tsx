import type { Metadata } from 'next';
import './globals.css';

const title = 'Play Stunts — The classic racing game in your browser';
const description = 'Play Stunts / 4D Sports Driving in your browser. Choose your car, build tracks, race and watch replays — with original or upgraded graphics.';
const sharingImage = [{ url: 'https://playstunts.com/og.png', width: 1731, height: 909, alt: 'Stunts — Play in your browser at playstunts.com' }];
export const metadata: Metadata = {
  metadataBase: new URL('https://playstunts.com'),
  title,
  description,
  icons: { icon: [{ url: '/stunts-favicon.png', type: 'image/png', sizes: '64x64' }] },
  openGraph: { type: 'website', url: 'https://playstunts.com/', siteName: 'Play Stunts', title, description, images: sharingImage },
  twitter: { card: 'summary_large_image', title, description, images: sharingImage.map(image => image.url) },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head><link rel="preload" as="image" type="image/webp" href="/site/enhanced-artwork/SDMSEL-scrn-menu-display-v1.webp" imageSrcSet="/site/enhanced-artwork/SDMSEL-scrn-menu-display-640-v1.webp 640w, /site/enhanced-artwork/SDMSEL-scrn-menu-display-v1.webp 1280w" imageSizes="(max-width: 700px) calc(100vw - 54px), 960px" fetchPriority="high"/></head><body>{children}</body></html>;
}
