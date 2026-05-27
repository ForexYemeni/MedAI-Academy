import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "MedAI Academy - المنصة الطبية الذكية",
  description: "منصة التعليم الطبي الأذكى عربياً - مدعومة بالذكاء الاصطناعي. دورات طبية، محاكاة سريرية، اختبارات ذكية، ومساعد AI شخصي.",
  keywords: ["MedAI", "تعليم طبي", "ذكاء اصطناعي", "طب", "دورات طبية", "محاكاة", "اختبارات"],
  authors: [{ name: "MedAI Academy" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "MedAI Academy - المنصة الطبية الذكية",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
