import { NextResponse, type NextRequest } from 'next/server';
import { isSlug } from '@/lib/slug';
import { publicFloor } from '@/lib/movimento';

// Public: how busy the room is now, for the store's site and the panel's own "movimento" page.
// Only which tables are taken, never who is there.
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'public, max-age=0, s-maxage=15, stale-while-revalidate=30',
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const floor = isSlug(slug) ? await publicFloor(slug) : null;
  if (!floor) return NextResponse.json({ error: 'not_found' }, { status: 404, headers: HEADERS });
  return NextResponse.json(floor, { headers: HEADERS });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS });
}
