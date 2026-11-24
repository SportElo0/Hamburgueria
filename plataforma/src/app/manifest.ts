import type { MetadataRoute } from 'next';

// Lets the team put the panel on the phone's home screen with the Growlift icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Painel Growlift',
    short_name: 'Growlift',
    description: 'Painel das lojas da Growlift.',
    id: '/painel',
    start_url: '/painel',
    scope: '/',
    display: 'standalone',
    background_color: '#f4f6fa',
    theme_color: '#f4f6fa',
    lang: 'pt-BR',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
