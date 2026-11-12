import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // This app lives inside a repository with other projects; keep its own folder as the root.
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ['pg'],
  async headers() {
    const base = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ];
    return [
      // Only the embeddable form may be framed by other sites.
      { source: '/:path((?!incorporar/).*)', headers: [...base, { key: 'X-Frame-Options', value: 'DENY' }] },
      { source: '/incorporar/:path*', headers: base },
    ];
  },
};

export default nextConfig;
