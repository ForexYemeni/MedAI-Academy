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
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a1a' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
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
