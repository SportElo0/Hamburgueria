import { NextResponse, type NextRequest } from 'next/server';
import { isSlug } from '@/lib/slug';
import { clientIp } from '@/lib/limits';
import { TableError, callFromTable, deviceCookie, joinTable, openTable, orderAtTable, tableState, validKey } from '@/lib/mesas';

// Public: the phones at a table. Every call carries the table's QR key; a phone's seat is its cookie.
const NO_STORE = { 'Cache-Control': 'no-store' };
/** A phone stays in the table for a meal's length; after that it reads the QR again. */
const HOURS_4 = 4 * 60 * 60;

function table(slug: string, numero: string, key: string | null) {
  const number = Number(numero);
  if (!isSlug(slug) || !/^\d{1,3}$/.test(numero) || !validKey(slug, number, key ?? '')) return null;
  return number;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string; numero: string }> }) {
  const { slug, numero } = await params;
  const number = table(slug, numero, request.nextUrl.searchParams.get('k'));
  if (number === null) return NextResponse.json({ error: 'Mesa não encontrada.' }, { status: 404, headers: NO_STORE });
  const state = await tableState(slug, number, request.cookies.get(deviceCookie(slug, number))?.value);
  return NextResponse.json(state, { headers: NO_STORE });
}

interface Body {
  k?: string;
  action?: 'abrir' | 'entrar' | 'pedir' | 'chamar';
  code?: string;
  kind?: 'garcom' | 'conta';
  items?: unknown;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string; numero: string }> }) {
  const { slug, numero } = await params;
  // Only this site's own pages post here (the cookie is SameSite=Lax; this closes the rest).
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Origem não permitida.' }, { status: 403, headers: NO_STORE });
  const text = await request.text();
  if (text.length > 20_000) return NextResponse.json({ error: 'Pedido grande demais.' }, { status: 413, headers: NO_STORE });
  let body: Body;
  try {
    body = JSON.parse(text) as Body;
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400, headers: NO_STORE });
  }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400, headers: NO_STORE });
  const number = table(slug, numero, body.k ?? null);
  if (number === null) return NextResponse.json({ error: 'Mesa não encontrada.' }, { status: 404, headers: NO_STORE });
  const cookie = deviceCookie(slug, number);
  const token = request.cookies.get(cookie)?.value;
  const ip = clientIp(request.headers);

  try {
    let newToken: string | null = null;
    if (body.action === 'abrir') newToken = await openTable(slug, number, ip);
    else if (body.action === 'entrar') newToken = await joinTable(slug, number, String(body.code ?? ''), ip);
    else if (body.action === 'pedir') await orderAtTable(slug, number, token, { items: body.items });
    else if (body.action === 'chamar' && (body.kind === 'garcom' || body.kind === 'conta')) await callFromTable(slug, number, token, body.kind);
    else return NextResponse.json({ error: 'Ação inválida.' }, { status: 400, headers: NO_STORE });

    const state = await tableState(slug, number, newToken ?? token);
    const res = NextResponse.json(state, { headers: NO_STORE });
    if (newToken) {
      res.cookies.set(cookie, newToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: HOURS_4 });
    }
    return res;
  } catch (err) {
    if (err instanceof TableError) return NextResponse.json({ error: err.message }, { status: 422, headers: NO_STORE });
    console.error('mesa', body.action, err);
    return NextResponse.json({ error: 'Não foi possível agora. Tente de novo ou chame o garçom.' }, { status: 500, headers: NO_STORE });
  }
}
