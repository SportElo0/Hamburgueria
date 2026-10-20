import { NextResponse, type NextRequest } from 'next/server';
import { simulateDemoPayment, trackOrder } from '@/lib/orders';
import { isSlug } from '@/lib/slug';

// Public: the customer's tracking page. The token from their link is the only key; without it, 404.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};
const NOT_FOUND = () => NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404, headers: CORS });

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  if (!isSlug(slug)) return NOT_FOUND();
  const order = await trackOrder(slug, id, request.nextUrl.searchParams.get('t') ?? '');
  return order ? NextResponse.json(order, { headers: CORS }) : NOT_FOUND();
}

/** `{ action: 'simular-pix', token }`: completes a practice (demo) Pix. Real charges are only settled by the provider. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  if (!isSlug(slug)) return NOT_FOUND();
  const body = (await request.json().catch(() => ({}))) as { action?: string; token?: string };
  if (body.action !== 'simular-pix') return NextResponse.json({ error: 'Ação inválida.' }, { status: 400, headers: CORS });
  const order = await simulateDemoPayment(slug, id, String(body.token ?? ''));
  return order ? NextResponse.json(order, { headers: CORS }) : NOT_FOUND();
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
