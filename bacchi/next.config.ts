import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // This app lives inside a bigger repository; keep its own folder as the project root.
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // test deploys stay out of search engines until the site is approved (INDEXAR=sim)
          ...(process.env.INDEXAR === 'sim' ? [] : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]),
        ],
      },
      { source: '/video/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ];
  },
};

export default nextConfig;
