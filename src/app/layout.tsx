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
          CRITICAL: FORCE DARK MODE PERMANENTLY.
          Runs SYNCHRONOUSLY before React hydration.

          WHY: The app's UI components were authored against a dark palette
          (bg-slate-900, text-cyan-400, bg-[#0a0e1a], etc. — 1000+ explicit
          dark colors). Auto-switching to light mode based on prefers-color-scheme
          or even an old localStorage value breaks the UI (e.g. "تسجيل الدخول"
          text becomes invisible: text-muted-foreground (#64748B in light) on
          a hardcoded #0a0e1a black background).

          FIX: Always force `dark` class on <html>. Remove any `light` class.
          Even if localStorage has 'medai-theme=light' from an old session,
          we still force dark — the `.light` CSS class is now aliased to the
          same dark palette as a safety net, so even if it leaks through, the
          UI still looks correct.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // ALWAYS force dark. Ignore localStorage AND prefers-color-scheme.
                  // The light theme is disabled at the CSS level too (.light is
                  // aliased to the dark palette), so this is belt-and-suspenders.
                  var root = document.documentElement;
                  root.classList.remove('light');
                  if (!root.classList.contains('dark')) {
                    root.classList.add('dark');
                  }
                  root.style.colorScheme = 'dark';

                  // Overwrite any stale 'light' preference in localStorage so
                  // the ThemeProvider (which reads localStorage) also stays dark.
                  try {
                    if (localStorage.getItem('medai-theme') !== 'dark') {
                      localStorage.setItem('medai-theme', 'dark');
                    }
                  } catch (e) {}

                  // Force <meta name="theme-color"> to the dark color
                  var meta = document.querySelector('meta[name="theme-color"]');
                  if (!meta) {
                    meta = document.createElement('meta');
                    meta.setAttribute('name', 'theme-color');
                    document.head.appendChild(meta);
                  }
                  meta.setAttribute('content', '#0a0e1a');
                } catch (e) {
                  // Last-resort fallback: just ensure the dark class is set.
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
