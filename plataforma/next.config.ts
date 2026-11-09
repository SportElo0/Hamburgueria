import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // This app lives inside the Downtown site's repository; keep its own folder as the project root.
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  // Conteúdos reads the social kit copied in by scripts/conteudos.mjs (see the build script).
  outputFileTracingIncludes: {
    // Only the routes that serve the files carry them (213 MB): every other Conteúdos page reads just the lists.
    // Bundling the files into every page made each one its own Vercel function, past the Hobby limit of 12.
    '/painel/conteudos': ['./conteudos-gerados/manifest.json', './conteudos-gerados/agenda.json'],
    '/painel/conteudos/**': ['./conteudos-gerados/manifest.json', './conteudos-gerados/agenda.json'],
    '/painel/conteudos/arquivo/**': ['./conteudos-gerados/**/*'],
    '/painel/conteudos/zip': ['./conteudos-gerados/**/*'],
    // The Instagram agenda: the public file links and the publisher read the same copy.
    '/api/conteudos/**': ['./conteudos-gerados/**/*'],
    '/api/instagram/**': ['./conteudos-gerados/agenda.json', './conteudos-gerados/manifest.json'],
  },
  // The panel is never framed by another site (except the live-floor widget); files keep their declared type.
  async headers() {
    return [
      {
        // Everything except the live-floor widget, which restaurants embed in their own sites.
        source: '/:path((?!movimento/[^/]+/embed$).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // The iPhone's AR files: Quick Look only opens a USDZ sent with its own type.
        source: '/3d/:file*.usdz',
        headers: [{ key: 'Content-Type', value: 'model/vnd.usdz+zip' }],
      },
      {
        // Demo dishes are public files: other Growlift pages (sales demos) may load them in their 3D viewer.
        source: '/3d/:file*',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
      {
        // Read-only and public (tables free or taken, nothing personal): any site may frame it.
        source: '/movimento/:slug/embed',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Caixa Portugal (pessoal, ver src/lib/viagem.ts): fora do Google.
        source: '/viagem',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
  // /viagem serve a página estática public/viagem.html (o Caixa Portugal).
  async rewrites() {
    return [{ source: '/viagem', destination: '/viagem.html' }];
  },
  // Image uploads go through a Server Function; menu photos are small, but phones shoot big files.
  experimental: { serverActions: { bodySizeLimit: '6mb' } },
};

export default nextConfig;
