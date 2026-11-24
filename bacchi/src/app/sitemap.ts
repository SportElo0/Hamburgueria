import type { MetadataRoute } from 'next';
import { PRODUTOS } from '@/data/catalogo';
import { SITE_URL } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const fixas = ['', '/produtos', '/sobre', '/representantes', '/contato'];
  return [
    ...fixas.map((c) => ({ url: `${SITE_URL}${c}`, changeFrequency: 'monthly' as const, priority: c === '' ? 1 : 0.8 })),
    ...PRODUTOS.map((p) => ({ url: `${SITE_URL}/produtos/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
