import { NextResponse, type NextRequest } from 'next/server';
import { addSubscriber, SubscribeError } from '@/lib/subscribers';
import { isSlug } from '@/lib/slug';
import { clientIp } from '@/lib/limits';

// Public: a store's site sends "quero receber ofertas" sign-ups here (name, WhatsApp, consent).
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
  if (text.length > 4_000) return NextResponse.json({ error: 'Envio grande demais.' }, { status: 413, headers: CORS });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Envio inválido.' }, { status: 400, headers: CORS });
  }
  try {
    await addSubscriber(slug, body, new Date(), clientIp(request.headers));
    return NextResponse.json({ ok: true }, { status: 201, headers: CORS });
  } catch (err) {
    if (err instanceof SubscribeError) return NextResponse.json({ error: err.message }, { status: 422, headers: CORS });
    console.error('addSubscriber', err);
    return NextResponse.json({ error: 'Não foi possível enviar agora. Tente de novo em instantes.' }, { status: 500, headers: CORS });
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
