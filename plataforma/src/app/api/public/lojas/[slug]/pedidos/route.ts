import { NextResponse, type NextRequest } from 'next/server';
import { OrderError, placeOrder } from '@/lib/orders';
import { publicOrder } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';
import { clientIp } from '@/lib/limits';

// Public: a store's site sends the customer's order here. Prices come from the published catalogue.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404, headers: CORS });
  const text = await request.text();
  if (text.length > 50_000) return NextResponse.json({ error: 'Pedido grande demais.' }, { status: 413, headers: CORS });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400, headers: CORS });
  }
  try {
    const { order, token } = await placeOrder(slug, body, request.nextUrl.origin, new Date(), clientIp(request.headers));
    return NextResponse.json({ id: order.id, token, order: publicOrder(order) }, { status: 201, headers: CORS });
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: 422, headers: CORS });
    console.error('placeOrder', err);
    return NextResponse.json({ error: 'Não foi possível enviar o pedido agora. Tente de novo em instantes.' }, { status: 500, headers: CORS });
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
