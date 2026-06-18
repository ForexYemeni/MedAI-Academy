import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep ignoring TS build errors for now (legacy code), but this is a tech-debt item.
  typescript: {
    ignoreBuildErrors: true,
  },
  // ESLint is configured via eslint.config.mjs in Next.js 16.
  // Lint errors won't block production builds by default.

  reactStrictMode: false,

  // Compress responses with gzip/brotli at the framework layer
  // (Vercel already does this, but enabling it also helps self-hosted / preview envs).
  compress: true,

  // Hide the X-Powered-By header for a tiny security/footprint win.
  poweredByHeader: false,

  // Modern image formats. next/image will automatically serve AVIF or WebP
  // when the browser supports it — saves ~30-50% bytes per image on mobile.
  images: {
    formats: ['image/avif', 'image/webp'],
    // Allow optimized serving of the existing course / icon images that live
    // outside /public (currently served as raw static files).
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    // Reasonable defaults so a single huge hero image can't dominate the LCP.
    minimumCacheTTL: 60 * 60 * 24, // 1 day
  },

  // Strip console.* from production builds (errors are kept).
  // This shaves a few KB off the main bundle and avoids leaking debug logs.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  async headers() {
    return [
      {
        // Service Worker headers - allow SW to control all routes
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // Manifest headers - no cache to ensure latest name is always used
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        // Offline page headers
        source: '/offline.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800',
          },
        ],
      },
      // Long-cache static course / icon images — they never change between
      // deploys because their content is content-addressed by filename.
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/courses/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/emergency-meds/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
