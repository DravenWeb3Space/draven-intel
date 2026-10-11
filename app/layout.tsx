import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Draven Intel — Institutional Airdrop Intelligence',
  description: 'AI-powered 6-step airdrop evaluation with autonomous monitoring and immutable proof of work.',
};

// Runs before first paint so the saved theme is applied with no flash.
const THEME_SCRIPT = `try{var t=localStorage.getItem('draven_theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
