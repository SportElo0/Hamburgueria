import type { MetadataRoute } from 'next';
import { INDEXAR, SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  if (!INDEXAR) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/cotacao'] }], sitemap: `${SITE_URL}/sitemap.xml` };
}
