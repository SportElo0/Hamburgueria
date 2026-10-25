import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // This app lives inside the Downtown site's repository; keep its own folder as the project root.
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  // Conteúdos reads the social kit copied in by scripts/conteudos.mjs (see the build script).
  outputFileTracingIncludes: {
    '/painel/conteudos': ['./conteudos-gerados/manifest.json'],
    '/painel/conteudos/**': ['./conteudos-gerados/**/*'],
  },
  // The panel is never framed by another site; files keep their declared type.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  // Image uploads go through a Server Function; menu photos are small, but phones shoot big files.
  experimental: { serverActions: { bodySizeLimit: '6mb' } },
};

export default nextConfig;
