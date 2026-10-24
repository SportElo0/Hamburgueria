import { NextResponse, type NextRequest } from 'next/server';
import { getPublished } from '@/lib/stores';
import { applyCoupon, brl, OrderError, orderingOf } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';

// Public: lets the checkout show a coupon's discount before the order. The order itself checks it again.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = (await request.json().catch(() => ({}))) as { code?: unknown; subtotal?: unknown };
  const code = typeof body.code === 'string' ? body.code.slice(0, 20) : '';
  const subtotal = typeof body.subtotal === 'number' && Number.isInteger(body.subtotal) && body.subtotal >= 0 ? body.subtotal : 0;
  const record = isSlug(slug) ? await getPublished(slug) : null;
  if (!record || !code) return NextResponse.json({ error: 'Cupom inválido ou vencido.' }, { status: 422, headers: CORS });
  try {
    const { code: applied, discount, freeDelivery } = applyCoupon(orderingOf(record.store), code, subtotal);
    const label = freeDelivery ? `${applied}: entrega grátis` : `${applied}: ${brl(discount)} de desconto`;
    return NextResponse.json({ code: applied, discount, freeDelivery, label }, { headers: CORS });
  } catch (err) {
    return NextResponse.json({ error: err instanceof OrderError ? err.message : 'Cupom inválido ou vencido.' }, { status: 422, headers: CORS });
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
