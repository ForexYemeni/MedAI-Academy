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
  // Single dark themeColor. The app defaults to dark mode on first visit
  // regardless of OS preference — this matches the original design intent.
  // The user can still manually toggle to light mode via the in-app button,
  // and the ThemeProvider will update this meta tag accordingly.
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
          CRITICAL: Anti-FOUC (Flash Of Unstyled Content) theme bootstrap.
          Runs SYNCHRONOUSLY before React hydration.

          BEHAVIOR:
          - If the user has explicitly chosen a theme via the in-app toggle
            (stored in localStorage as 'medai-theme'), honor that choice.
          - Otherwise, DEFAULT TO DARK. Do NOT follow prefers-color-scheme.

          WHY: The app's UI was designed for dark mode. On phones whose OS
          is set to light mode, following prefers-color-scheme would switch
          the app to light mode automatically — but the user reported that
          this looks "broken" and inconsistent with other phones. Defaulting
          to dark on first visit ensures every phone sees the same intended
          design. The user can still manually toggle to light mode if they
          want via the in-app button (the ThemeProvider persists that choice
          to localStorage, which this script will then honor on next visit).
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var STORAGE_KEY = 'medai-theme';
                  var saved = localStorage.getItem(STORAGE_KEY);
                  // ONLY honor an explicit user choice. Ignore OS preference.
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
                  try {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } catch (e2) {}
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
