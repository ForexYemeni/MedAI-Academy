import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/med/layout/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  // Single dark themeColor — we force dark as the default regardless of OS
  // preference because the app's components use 1000+ hardcoded dark colors.
  // The user can still toggle to light mode manually via the in-app toggle,
  // and the inline bootstrap script in <head> keeps this meta tag in sync.
  themeColor: '#0a0e1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: "أكاديمية نبض - المنصة الطبية الذكية",
  description: "منصة التعليم الطبي الأذكى عربياً - مدعومة بالذكاء الاصطناعي. دورات طبية، محاكاة سريرية، اختبارات ذكية، ومساعد AI شخصي.",
  keywords: ["أكاديمية نبض", "تعليم طبي", "ذكاء اصطناعي", "طب", "دورات طبية", "محاكاة", "اختبارات"],
  authors: [{ name: "أكاديمية نبض" }],
  manifest: "/manifest.json?v=5",
  icons: {
    icon: [
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "أكاديمية نبض",
  },
  openGraph: {
    title: "أكاديمية نبض - المنصة الطبية الذكية",
    description: "منصة التعليم الطبي الأذكى عربياً - مدعومة بالذكاء الاصطناعي",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json?v=5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="أكاديمية نبض" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        {/*
          CRITICAL: Anti-FOUC theme bootstrap + force dark as the default.
          Runs SYNCHRONOUSLY before React hydration.

          WHY we ignore prefers-color-scheme:
          The app's UI components were authored against a dark palette
          (bg-slate-900, text-cyan-400, etc. — 1000+ explicit dark colors).
          Auto-switching to light mode via system preference makes the UI
          look broken on phones whose OS is set to light mode. Until the
          light theme is fully migrated to use CSS variables, we default
          to dark and ONLY honor the user's explicit choice in localStorage.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var STORAGE_KEY = 'medai-theme';
                  var saved = localStorage.getItem(STORAGE_KEY);
                  // Only honor an EXPLICIT user choice. Ignore OS preference.
                  var theme = (saved === 'light') ? 'light' : 'dark';
                  var root = document.documentElement;
                  root.classList.remove('dark', 'light');
                  root.classList.add(theme);
                  root.style.colorScheme = theme;
                  var meta = document.querySelector('meta[name="theme-color"]');
                  if (!meta) {
                    meta = document.createElement('meta');
                    meta.setAttribute('name', 'theme-color');
                    document.head.appendChild(meta);
                  }
                  meta.setAttribute('content', theme === 'light' ? '#F4F7FB' : '#0a0e1a');
                } catch (e) {
                  console.warn('[Theme] Bootstrap failed, defaulting to dark:', e);
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
        {/* Register Service Worker (minimal, no fetch interception) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (!('serviceWorker' in navigator)) return;
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none'
                  }).then(function(reg) {
                    console.log('[SW] Registered');
                    reg.update().catch(function() {});
                  }).catch(function(err) {
                    console.warn('[SW] Registration failed:', err);
                  });
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
