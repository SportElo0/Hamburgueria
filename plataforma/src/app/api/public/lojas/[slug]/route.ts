import { NextResponse, type NextRequest } from 'next/server';
import { getPublished } from '@/lib/stores';
import { getOperation } from '@/lib/orders';
import { toPublic } from '@/lib/schema';
import { isSlug } from '@/lib/slug';

// Public, read-only: the catalogue a store's site renders. Never includes the internal account data.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) return NextResponse.json({ error: 'not_found' }, { status: 404, headers: CORS });
  const [record, operation] = await Promise.all([getPublished(slug), getOperation(slug)]);
  if (!record) return NextResponse.json({ error: 'not_found' }, { status: 404, headers: { ...CORS, 'Cache-Control': 'public, s-maxage=30' } });
  const mediaBase = `${request.nextUrl.origin}/api/midia`;
  return NextResponse.json(toPublic(record.store, record.publishedAt, mediaBase, operation.open), {
    headers: {
      ...CORS,
      // Short edge cache: the open/closed switch must reach the site within seconds. Stale copies
      // still keep sites up if storage blips.
      'Cache-Control': 'public, max-age=0, s-maxage=5, stale-while-revalidate=30, stale-if-error=86400',
    },
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
